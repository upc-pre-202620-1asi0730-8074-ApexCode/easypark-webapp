<script setup>
import {computed, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";
import useParkingManagementStore from "../../application/parking-management.store.js";
import {CreateFacilityCommand} from "../../domain/model/create-facility.command.js";
import {UpdateFacilityCommand} from "../../domain/model/update-facility.command.js";

const props = defineProps({
  operatorProfileId: {type: Number, required: true}
});
const visible = defineModel('visible', {type: Boolean, default: false});

const {t} = useI18n();
const toast = useToast();
const store = useParkingManagementStore();

const form = reactive({name: '', address: '', latitude: null, longitude: null, hourlyRate: null, openTime: '08:00', closeTime: '22:00'});
const submitted = ref(false);
const loading = ref(false);
const failed = ref(false);

const isEditing = computed(() => store.currentFacility !== null);

const requiredError = (value) => value && value.trim() ? null : t('parking-management.validation.required');
const errorsByField = computed(() => ({
  name: requiredError(form.name),
  address: requiredError(form.address),
  hourlyRate: form.hourlyRate > 0 ? null : t('parking-management.validation.positive-number')
}));
const hasErrors = computed(() => Object.values(errorsByField.value).some(Boolean));

watch(visible, (isVisible) => {
  if (!isVisible) return;
  const facility = store.currentFacility;
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
});

async function performSave() {
  submitted.value = true;
  failed.value = false;
  if (hasErrors.value) return;
  loading.value = true;
  const result = isEditing.value
      ? await store.updateFacility(new UpdateFacilityCommand(form))
      : await store.createFacility(new CreateFacilityCommand({...form, operatorProfileId: props.operatorProfileId}));
  loading.value = false;
  if (!result.success) {
    failed.value = true;
    return;
  }
  toast.add({severity: 'success', summary: t(isEditing.value ? 'parking-management.facility-form.updated' : 'parking-management.facility-form.created'), life: 4000});
  visible.value = false;
}
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="t(isEditing ? 'parking-management.facility-form.edit-title' : 'parking-management.facility-form.create-title')"
             :style="{ width: '560px' }" :breakpoints="{ '640px': '92vw' }">
    <pv-message v-if="failed" severity="error" class="mb-4" role="alert">{{ t('parking-management.facility-form.failed') }}</pv-message>
    <form id="facility-form" novalidate @submit.prevent="performSave">
      <div class="form-field">
        <label for="facility-name" class="form-label">{{ t('parking-management.fields.name') }}</label>
        <pv-input-text id="facility-name" v-model="form.name" maxlength="80" :invalid="submitted && !!errorsByField.name"/>
        <small v-if="submitted && errorsByField.name" class="form-error">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ errorsByField.name }}
        </small>
      </div>
      <div class="form-field">
        <label for="facility-address" class="form-label">{{ t('parking-management.fields.address') }}</label>
        <pv-input-text id="facility-address" v-model="form.address" maxlength="150" :invalid="submitted && !!errorsByField.address"/>
        <small v-if="submitted && errorsByField.address" class="form-error">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ errorsByField.address }}
        </small>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label for="facility-open-time" class="form-label">{{ t('parking-management.fields.open-time') }}</label>
          <pv-input-text id="facility-open-time" v-model="form.openTime" type="time"/>
        </div>
        <div class="form-field">
          <label for="facility-close-time" class="form-label">{{ t('parking-management.fields.close-time') }}</label>
          <pv-input-text id="facility-close-time" v-model="form.closeTime" type="time"/>
        </div>
      </div>
      <div class="form-field">
        <label for="facility-hourly-rate" class="form-label">{{ t('parking-management.fields.hourly-rate') }}</label>
        <pv-input-number input-id="facility-hourly-rate" v-model="form.hourlyRate" mode="currency" currency="PEN" locale="es-PE"
                         :min-fraction-digits="2" :invalid="submitted && !!errorsByField.hourlyRate"/>
        <small v-if="submitted && errorsByField.hourlyRate" class="form-error">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ errorsByField.hourlyRate }}
        </small>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label for="facility-latitude" class="form-label">{{ t('parking-management.fields.latitude') }}</label>
          <pv-input-number input-id="facility-latitude" v-model="form.latitude" :min-fraction-digits="0" :max-fraction-digits="6"/>
        </div>
        <div class="form-field">
          <label for="facility-longitude" class="form-label">{{ t('parking-management.fields.longitude') }}</label>
          <pv-input-number input-id="facility-longitude" v-model="form.longitude" :min-fraction-digits="0" :max-fraction-digits="6"/>
        </div>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" severity="secondary" outlined @click="visible = false"/>
      <pv-button type="submit" form="facility-form" :label="t('common.save')" :loading="loading"/>
    </template>
  </pv-dialog>
</template>
