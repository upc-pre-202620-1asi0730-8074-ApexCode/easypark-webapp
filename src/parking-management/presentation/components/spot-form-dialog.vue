<script setup>
import {computed, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";
import useParkingManagementStore from "../../application/parking-management.store.js";
import {SpotType} from "../../domain/model/spot-type.js";
import {CreateSpotCommand} from "../../domain/model/create-spot.command.js";
import {UpdateSpotCommand} from "../../domain/model/update-spot.command.js";

const props = defineProps({
  spot: {type: Object, default: null}
});
const visible = defineModel('visible', {type: Boolean, default: false});

const {t} = useI18n();
const toast = useToast();
const store = useParkingManagementStore();

const form = reactive({code: '', level: 1, type: SpotType.CAR});
const submitted = ref(false);
const loading = ref(false);
const failureReason = ref(null);

const isEditing = computed(() => props.spot !== null);
const typeOptions = computed(() => Object.values(SpotType).map(type => ({label: t(`parking-management.spots.types.${type}`), value: type})));

const codeError = computed(() => {
  if (!form.code.trim()) return t('parking-management.validation.required');
  if (failureReason.value === 'code-taken') return t('parking-management.spots.errors.code-taken');
  return null;
});

watch(visible, (isVisible) => {
  if (!isVisible) return;
  Object.assign(form, {
    code: props.spot?.code ?? '',
    level: props.spot?.level ?? 1,
    type: props.spot?.type ?? SpotType.CAR
  });
  submitted.value = false;
  failureReason.value = null;
});

function clearCodeFailure() {
  if (failureReason.value !== 'failed') failureReason.value = null;
}

async function performSave() {
  submitted.value = true;
  failureReason.value = null;
  if (codeError.value) return;
  loading.value = true;
  const result = isEditing.value
      ? await store.updateSpot(new UpdateSpotCommand({spotId: props.spot.id, code: form.code, level: form.level, type: form.type}))
      : await store.createSpot(new CreateSpotCommand(form));
  loading.value = false;
  if (!result.success) {
    failureReason.value = result.reason;
    return;
  }
  toast.add({severity: 'success', summary: t(isEditing.value ? 'parking-management.spots.updated' : 'parking-management.spots.registered'), life: 4000});
  visible.value = false;
}
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="t(isEditing ? 'parking-management.spots.edit-title' : 'parking-management.spots.register-title')"
             :style="{ width: '480px' }" :breakpoints="{ '575px': '92vw' }">
    <form id="spot-form" novalidate @submit.prevent="performSave">
      <div class="form-field">
        <label for="spot-code" class="form-label">{{ t('parking-management.fields.spot-code') }}</label>
        <pv-input-text id="spot-code" v-model="form.code" maxlength="10" placeholder="A-01"
                       class="spot-form__code" @input="clearCodeFailure" :invalid="submitted && !!codeError"/>
        <small v-if="submitted && codeError" class="form-error">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ codeError }}
        </small>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label for="spot-level" class="form-label">{{ t('parking-management.fields.spot-level') }}</label>
          <pv-input-number input-id="spot-level" v-model="form.level" :min="1" show-buttons/>
        </div>
        <div class="form-field">
          <label for="spot-type" class="form-label">{{ t('parking-management.fields.spot-type') }}</label>
          <pv-select input-id="spot-type" v-model="form.type" :options="typeOptions" option-label="label" option-value="value"/>
        </div>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" severity="secondary" outlined @click="visible = false"/>
      <pv-button type="submit" form="spot-form" :label="t('common.save')" :loading="loading"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.spot-form__code {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
</style>
