
<script setup>
import {computed, reactive, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useToast} from 'primevue/usetoast';
import useParkingManagementStore from '../../application/parking-management.store.js';
import {CreateFacilityCommand} from '../../domain/model/create-facility.command.js';
import {UpdateFacilityCommand} from '../../domain/model/update-facility.command.js';
import {parkingManagementLabels} from '../parking-management-labels.js';

const props = defineProps({
  operatorProfileId: {
    type: [Number, String],
    default: null
  },
  facility: {
    type: Object,
    default: null
  }
});

const visible = defineModel('visible', {
  type: Boolean,
  default: false
});

const {t, locale} = useI18n();
const toast = useToast();
const store = useParkingManagementStore();
const labels = computed(() => parkingManagementLabels(locale.value));

const form = reactive({
  name: '',
  address: '',
  latitude: null,
  longitude: null,
  hourlyRate: null,
  openTime: '08:00',
  closeTime: '22:00'
});

const submitted = ref(false);
const loading = ref(false);
const failed = ref(false);

const isEditing = computed(() => props.facility !== null);

function requiredError(value) {
  return String(value ?? '').trim()
      ? null
      : t('parking-management.validation.required');
}

const errorsByField = computed(() => ({
  name: requiredError(form.name),
  address: requiredError(form.address),
  hourlyRate: Number(form.hourlyRate) > 0
      ? null
      : t('parking-management.validation.positive-number')
}));

const hasErrors = computed(() =>
    Object.values(errorsByField.value).some(Boolean)
);

watch(
    [visible, () => props.facility],
    ([isVisible]) => {
      if (!isVisible) return;

      const facility = props.facility;

      Object.assign(form, {
        name: facility?.name ?? '',
        address: facility?.address ?? '',
        latitude: facility?.latitude ?? null,
        longitude: facility?.longitude ?? null,
        hourlyRate: facility?.hourlyRate ?? null,
        openTime: facility?.openTime ?? '08:00',
        closeTime: facility?.closeTime ?? '22:00'
      });

      submitted.value = false;
      failed.value = false;
    }
);

async function performSave() {
  if (loading.value) return;

  submitted.value = true;
  failed.value = false;

  if (hasErrors.value) return;

  loading.value = true;

  try {
    const result = isEditing.value
        ? await store.updateFacility(
            new UpdateFacilityCommand(form),
            props.facility.id
        )
        : await store.createFacility(
            new CreateFacilityCommand({
              ...form,
              operatorProfileId: props.operatorProfileId
            })
        );

    if (!result.success) {
      failed.value = true;
      return;
    }

    toast.add({
      severity: 'success',
      summary: t(
          isEditing.value
              ? 'parking-management.facility-form.updated'
              : 'parking-management.facility-form.created'
      ),
      life: 4000
    });

    visible.value = false;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <pv-dialog
      v-model:visible="visible"
      modal
      :header="isEditing ? labels.editZone : labels.newZone"
      :style="{width: 'min(560px, 95vw)'}">

    <pv-message
        v-if="failed"
        severity="error"
        class="mb-4"
        role="alert">
      {{ t('parking-management.facility-form.failed') }}
    </pv-message>

    <form
        id="facility-form"
        novalidate
        @submit.prevent="performSave">

      <div class="form-field">
        <label for="facility-name" class="form-label">
          {{ t('parking-management.fields.name') }}
        </label>

        <pv-input-text
            id="facility-name"
            v-model="form.name"
            maxlength="80"
            :invalid="submitted && !!errorsByField.name"/>

        <small
            v-if="submitted && errorsByField.name"
            class="form-error">
          {{ errorsByField.name }}
        </small>
      </div>

      <div class="form-field">
        <label for="facility-address" class="form-label">
          {{ t('parking-management.fields.address') }}
        </label>

        <pv-input-text
            id="facility-address"
            v-model="form.address"
            maxlength="150"
            placeholder="Av. Larco 345, Miraflores"
            :invalid="submitted && !!errorsByField.address"/>

        <small class="facility-form__hint">
          {{ labels.includeDistrict }}
        </small>

        <small
            v-if="submitted && errorsByField.address"
            class="form-error">
          {{ errorsByField.address }}
        </small>
      </div>

      <div class="form-grid">
        <div class="form-field">
          <label for="facility-open-time" class="form-label">
            {{ t('parking-management.fields.open-time') }}
          </label>

          <pv-input-text
              id="facility-open-time"
              v-model="form.openTime"
              type="time"/>
        </div>

        <div class="form-field">
          <label for="facility-close-time" class="form-label">
            {{ t('parking-management.fields.close-time') }}
          </label>

          <pv-input-text
              id="facility-close-time"
              v-model="form.closeTime"
              type="time"/>
        </div>
      </div>

      <div class="form-field">
        <label for="facility-hourly-rate" class="form-label">
          {{ t('parking-management.fields.hourly-rate') }}
        </label>

        <pv-input-number
            input-id="facility-hourly-rate"
            v-model="form.hourlyRate"
            mode="currency"
            currency="PEN"
            locale="es-PE"
            :min-fraction-digits="2"
            :invalid="submitted && !!errorsByField.hourlyRate"/>

        <small
            v-if="submitted && errorsByField.hourlyRate"
            class="form-error">
          {{ errorsByField.hourlyRate }}
        </small>
      </div>

      <div class="form-grid">
        <div class="form-field">
          <label for="facility-latitude" class="form-label">
            {{ t('parking-management.fields.latitude') }}
          </label>

          <pv-input-number
              input-id="facility-latitude"
              v-model="form.latitude"
              :min="-90"
              :max="90"
              :min-fraction-digits="0"
              :max-fraction-digits="6"/>
        </div>

        <div class="form-field">
          <label for="facility-longitude" class="form-label">
            {{ t('parking-management.fields.longitude') }}
          </label>

          <pv-input-number
              input-id="facility-longitude"
              v-model="form.longitude"
              :min="-180"
              :max="180"
              :min-fraction-digits="0"
              :max-fraction-digits="6"/>
        </div>
      </div>
    </form>

    <template #footer>
      <pv-button
          :label="labels.cancel"
          severity="secondary"
          outlined
          :disabled="loading"
          @click="visible = false"/>

      <pv-button
          type="submit"
          form="facility-form"
          :label="t('common.save')"
          :loading="loading"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.facility-form__hint {
  color: var(--ep-text-secondary);
  font-size: 11px;
}
</style>
