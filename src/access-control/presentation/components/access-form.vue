<script setup>
import {computed, reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";

import useAccessControlStore from "../../application/access-control.store.js";
import useIamStore from "../../../iam/application/iam.store.js";

import {RegisterAccessCommand} from "../../domain/model/register-access.command.js";
import {MovementType} from "../../domain/model/movement-type.js";
import {RegistrationMethod} from "../../domain/model/registration-method.js";

import {PlateNumber} from "../../../profiles/domain/model/plate-number.js";

const {t} = useI18n();
const toast = useToast();

const store = useAccessControlStore();
const iamStore = useIamStore();

const form = reactive({
  plateNumber: '',
  type: MovementType.ENTRY,
  registrationMethod: RegistrationMethod.MANUAL,
  reservationCode: ''
});

const submitted = ref(false);
const loading = ref(false);

const typeOptions = computed(() => [
  {
    label: t('access-control.types.ENTRY'),
    value: MovementType.ENTRY
  },
  {
    label: t('access-control.types.EXIT'),
    value: MovementType.EXIT
  }
]);

const methodOptions = computed(() => [
  {
    label: t('access-control.methods.MANUAL'),
    value: RegistrationMethod.MANUAL
  },
  {
    label: t('access-control.methods.QR_CODE'),
    value: RegistrationMethod.QR_CODE
  }
]);

const plateError = computed(() => {
  if (!form.plateNumber.trim()) {
    return t('access-control.validation.required');
  }

  if (!PlateNumber.isValid(form.plateNumber)) {
    return t('access-control.errors.invalid-plate-number');
  }

  return null;
});

function normalizePlate() {
  const normalized =
      PlateNumber.normalize(
          form.plateNumber
      );

  if (normalized) {
    form.plateNumber = normalized;
  }
}

async function performSave() {
  submitted.value = true;

  if (
      !store.currentFacility ||
      plateError.value
  ) {
    return;
  }

  loading.value = true;

  const result =
      await store.registerAccess(
          new RegisterAccessCommand({
            parkingFacilityId:
            store.currentFacility.id,
            plateNumber:
            form.plateNumber,
            type:
            form.type,
            registrationMethod:
            form.registrationMethod,
            reservationCode:
            form.reservationCode,
            operatorId:
            iamStore.currentUserId
          })
      );

  loading.value = false;

  if (
      result.success &&
      result.reason === 'under-review'
  ) {
    toast.add({
      severity: 'warn',
      summary:
          t('access-control.messages.under-review'),
      life: 4000
    });

    resetForm();
    return;
  }

  if (!result.success) {
    toast.add({
      severity: 'error',
      summary:
          t(`access-control.errors.${result.reason}`),
      life: 4000
    });

    return;
  }

  toast.add({
    severity: 'success',
    summary: t(
        form.type === MovementType.ENTRY
            ? 'access-control.messages.entry-recorded'
            : 'access-control.messages.exit-recorded'
    ),
    life: 4000
  });

  resetForm();
}

function resetForm() {
  form.plateNumber = '';
  form.reservationCode = '';
  submitted.value = false;
}
</script>

<template>
  <section class="panel">
    <h2 class="panel-title mb-4">
      {{ t('access-control.form.title') }}
    </h2>

    <form
        id="access-form"
        novalidate
        @submit.prevent="performSave">

      <div class="form-grid">
        <div class="form-field">
          <label
              for="access-type"
              class="form-label">
            {{ t('access-control.fields.type') }}
          </label>

          <pv-select
              input-id="access-type"
              v-model="form.type"
              :options="typeOptions"
              option-label="label"
              option-value="value"/>
        </div>

        <div class="form-field">
          <label
              for="access-method"
              class="form-label">
            {{ t('access-control.fields.method') }}
          </label>

          <pv-select
              input-id="access-method"
              v-model="form.registrationMethod"
              :options="methodOptions"
              option-label="label"
              option-value="value"/>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-field">
          <label
              for="access-plate"
              class="form-label">
            {{ t('access-control.fields.plate') }}
          </label>

          <pv-input-text
              id="access-plate"
              v-model="form.plateNumber"
              maxlength="8"
              placeholder="ABC-123"
              :invalid="submitted && !!plateError"
              @blur="normalizePlate"/>

          <small
              v-if="submitted && plateError"
              class="form-error">
            <i
                class="pi pi-exclamation-circle"
                aria-hidden="true">
            </i>
            {{ plateError }}
          </small>
        </div>

        <div class="form-field">
          <label
              for="reservation-code"
              class="form-label">
            {{ t('access-control.fields.reservation-code') }}
          </label>

          <pv-input-text
              id="reservation-code"
              v-model="form.reservationCode"
              maxlength="30"
              :placeholder="t('access-control.form.optional')"/>
        </div>
      </div>

      <pv-button
          type="submit"
          :label="t('access-control.form.register')"
          :loading="loading"/>
    </form>
  </section>
</template>