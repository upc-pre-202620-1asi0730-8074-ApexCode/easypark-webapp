<script setup>
import {computed, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";
import useProfilesStore from "../../application/profiles.store.js";
import {PlateNumber} from "../../domain/model/plate-number.js";
import {VehicleType} from "../../domain/model/vehicle-type.js";
import {RegisterVehicleCommand} from "../../domain/model/register-vehicle.command.js";
import {UpdateVehicleCommand} from "../../domain/model/update-vehicle.command.js";

const props = defineProps({
  vehicle: { type: Object, default: null }
});
const visible = defineModel('visible', { type: Boolean, default: false });

const { t } = useI18n();
const toast = useToast();
const store = useProfilesStore();

const form = reactive({ plateNumber: '', type: VehicleType.CAR, color: '' });
const submitted = ref(false);
const loading = ref(false);
const failureReason = ref(null);

const isEditing = computed(() => props.vehicle !== null);
const typeOptions = computed(() => Object.values(VehicleType).map(type => ({ label: t(`profiles.vehicle-types.${type}`), value: type })));

const plateError = computed(() => {
  if (isEditing.value) return null;
  if (!form.plateNumber.trim()) return t('profiles.validation.required');
  if (!PlateNumber.isValid(form.plateNumber)) return t('profiles.vehicles.errors.invalid-plate-number');
  if (failureReason.value === 'plate-taken' || failureReason.value === 'plate-already-yours')
    return t(`profiles.vehicles.errors.${failureReason.value}`);
  return null;
});
const typeError = computed(() => form.type ? null : t('profiles.validation.required'));

watch(visible, (isVisible) => {
  if (!isVisible) return;
  Object.assign(form, {
    plateNumber: props.vehicle?.plateNumber.value ?? '',
    type: props.vehicle?.type ?? VehicleType.CAR,
    color: props.vehicle?.color ?? ''
  });
  submitted.value = false;
  failureReason.value = null;
});

function normalizePlate() {
  const normalized = PlateNumber.normalize(form.plateNumber);
  if (normalized) form.plateNumber = normalized;
}

function clearPlateFailure() {
  if (failureReason.value !== 'failed') failureReason.value = null;
}

async function performSave() {
  submitted.value = true;
  failureReason.value = null;
  if (plateError.value || typeError.value) return;
  loading.value = true;
  const result = isEditing.value
      ? await store.updateVehicle(new UpdateVehicleCommand({ vehicleId: props.vehicle.id, type: form.type, color: form.color }))
      : await store.registerVehicle(new RegisterVehicleCommand(form));
  loading.value = false;
  if (!result.success) {
    failureReason.value = result.reason;
    return;
  }
  toast.add({ severity: 'success', summary: t(isEditing.value ? 'profiles.vehicles.updated' : 'profiles.vehicles.registered'), life: 4000 });
  visible.value = false;
}
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="t(isEditing ? 'profiles.vehicles.edit-title' : 'profiles.vehicles.register-title')"
             :style="{ width: '480px' }" :breakpoints="{ '575px': '92vw' }">
    <pv-message v-if="failureReason === 'failed'" severity="error" class="mb-4" role="alert">
      {{ t('profiles.vehicles.errors.failed') }}
    </pv-message>
    <form id="vehicle-form" novalidate @submit.prevent="performSave">
      <div class="form-field">
        <label for="plate-number" class="form-label">{{ t('profiles.fields.plate-number') }}</label>
        <pv-input-text id="plate-number" v-model="form.plateNumber" maxlength="8" placeholder="ABC-123"
                       :disabled="isEditing" class="vehicle-form__plate" @blur="normalizePlate" @input="clearPlateFailure"
                       :invalid="submitted && !!plateError" aria-describedby="plate-number-hint"/>
        <small v-if="submitted && plateError" class="form-error">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ plateError }}
        </small>
        <small v-else id="plate-number-hint" class="vehicle-form__hint">
          {{ t(isEditing ? 'profiles.vehicles.plate-locked' : 'profiles.vehicles.plate-hint') }}
        </small>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label for="vehicle-type" class="form-label">{{ t('profiles.fields.vehicle-type') }}</label>
          <pv-select input-id="vehicle-type" v-model="form.type" :options="typeOptions" option-label="label"
                     option-value="value" :invalid="submitted && !!typeError"/>
        </div>
        <div class="form-field">
          <label for="vehicle-color" class="form-label">{{ t('profiles.fields.color') }}</label>
          <pv-input-text id="vehicle-color" v-model="form.color" maxlength="30"
                         :placeholder="t('profiles.vehicles.color-placeholder')"/>
        </div>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" severity="secondary" outlined @click="visible = false"/>
      <pv-button type="submit" form="vehicle-form" :label="t('common.save')" :loading="loading"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.vehicle-form__plate {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.vehicle-form__hint {
  font-size: 12px;
  color: var(--ep-text-secondary);
}
</style>
