
<script setup>
import {computed, reactive, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useToast} from 'primevue/usetoast';
import useMonitoringAlertsStore from '../../application/monitoring-alerts.store.js';
import {AlertType} from '../../domain/model/alert-type.js';
import {monitoringLabels} from '../monitoring-alerts-labels.js';

const props = defineProps({visible: {type: Boolean, default: false}});
const emit = defineEmits(['update:visible']);
const store = useMonitoringAlertsStore();
const toast = useToast();
const {locale} = useI18n();
const labels = computed(() => monitoringLabels(locale.value));
const selectedFacility = ref(null);
const busy = ref(false);
const errorMessage = ref('');
const types = [AlertType.CAPACITY_NEAR_LIMIT, AlertType.CAPACITY_CRITICAL, AlertType.STAY_EXCEEDED];
const defaults = {
  [AlertType.CAPACITY_NEAR_LIMIT]: 75,
  [AlertType.CAPACITY_CRITICAL]: 90,
  [AlertType.STAY_EXCEEDED]: 480
};
const form = reactive(Object.fromEntries(types.map(type => [type, {enabled: true, threshold: defaults[type]}])));
const isVisible = computed({
  get: () => props.visible,
  set: value => emit('update:visible', value)
});
const facilities = computed(() => store.facilities.map(facility => ({label: facility.name, value: facility.id})));

function resetForm() {
  errorMessage.value = '';
  for (const type of types) {
    const rule = store.ruleFor(selectedFacility.value, type);
    form[type].enabled = rule?.enabled ?? true;
    form[type].threshold = rule
        ? (type === AlertType.STAY_EXCEEDED ? Number(rule.threshold) : Math.round(Number(rule.threshold) * 100))
        : defaults[type];
  }
}

watch(() => props.visible, visible => {
  if (visible) {
    selectedFacility.value = store.currentFacility?.id ?? store.facilities[0]?.id ?? null;
    resetForm();
  }
});

let rulesRequestId = 0;
watch(selectedFacility, async facilityId => {
  if (!props.visible || facilityId == null) return;
  const requestId = ++rulesRequestId;
  await store.fetchRulesFor(facilityId);
  if (props.visible && requestId === rulesRequestId) resetForm();
});

function ruleLabel(type) {
  return type === AlertType.CAPACITY_NEAR_LIMIT ? labels.value.nearLimit :
      type === AlertType.CAPACITY_CRITICAL ? labels.value.critical : labels.value.stay;
}

async function save() {
  if (!selectedFacility.value || busy.value) return;
  errorMessage.value = '';
  if (types.some(type => !Number.isFinite(Number(form[type].threshold)) ||
      form[type].threshold == null || form[type].threshold < 0 ||
      (type !== AlertType.STAY_EXCEEDED && form[type].threshold > 100) ||
      !Number.isInteger(Number(form[type].threshold)))) {
    errorMessage.value = labels.value.invalidThreshold;
    return;
  }
  if (form[AlertType.CAPACITY_NEAR_LIMIT].enabled && form[AlertType.CAPACITY_CRITICAL].enabled &&
      form[AlertType.CAPACITY_NEAR_LIMIT].threshold >= form[AlertType.CAPACITY_CRITICAL].threshold) {
    errorMessage.value = labels.value.invalidOrder;
    return;
  }
  busy.value = true;
  try {
    for (const type of types) {
      const existing = store.ruleFor(selectedFacility.value, type);
      const threshold = type === AlertType.STAY_EXCEEDED
          ? Number(form[type].threshold) : Number(form[type].threshold) / 100;
      if (existing && existing.threshold === threshold && existing.enabled === form[type].enabled) continue;
      const result = await store.saveRule(selectedFacility.value, type, threshold, form[type].enabled);
      if (!result.success) {
        errorMessage.value = result.reason === 'invalid-threshold'
            ? labels.value.invalidThreshold : labels.value.rulesFailed;
        return;
      }
    }
    toast.add({severity: 'success', summary: labels.value.ruleSaved, life: 3500});
    isVisible.value = false;
  } finally {
    busy.value = false;
  }
}
</script>

<template>
  <pv-dialog v-model:visible="isVisible" :header="labels.rulesTitle" modal :style="{width:'min(560px, 96vw)'}">
    <form id="alert-rules-form" class="rule-dialog" @submit.prevent="save">
      <div class="form-field">
        <label for="rule-facility" class="form-label">{{ labels.facility }}</label>
        <pv-select input-id="rule-facility" v-model="selectedFacility" :options="facilities"
                   option-label="label" option-value="value" class="rule-dialog__field"/>
      </div>
      <div class="rule-dialog__rules">
        <div v-for="type in types" :key="type" class="rule-dialog__row"
             :class="{ 'rule-dialog__row--disabled': !form[type].enabled }">
          <div class="rule-dialog__name">
            <label :for="`rule-${type}`" class="form-label">{{ ruleLabel(type) }}</label>
            <label class="rule-dialog__enabled">
              <pv-checkbox v-model="form[type].enabled" binary/>
              {{ labels.enabled }}
            </label>
          </div>
          <pv-input-number :input-id="`rule-${type}`" v-model="form[type].threshold"
                           :min="0" :max="type === AlertType.STAY_EXCEEDED ? 100000 : 100"
                           :min-fraction-digits="0" :max-fraction-digits="0"
                           class="rule-dialog__number"/>
        </div>
      </div>
      <pv-message v-if="errorMessage" severity="error" role="alert">{{ errorMessage }}</pv-message>
    </form>
    <template #footer>
      <pv-button :label="labels.cancel" severity="secondary" outlined type="button"
                 :disabled="busy" @click="isVisible = false"/>
      <pv-button :label="labels.saveRules" icon="pi pi-check" type="submit" form="alert-rules-form" :loading="busy"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.rule-dialog {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rule-dialog__field {
  width: 100%;
}

.rule-dialog__rules {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.rule-dialog__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--ep-border);
  border-radius: 12px;
}

.rule-dialog__row--disabled {
  background: var(--ep-page);
}

.rule-dialog__name {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rule-dialog__enabled {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--ep-text-secondary);
}

.rule-dialog__number {
  width: 128px;
  flex: 0 0 128px;
}

@media (max-width: 500px) {
  .rule-dialog__number {
    width: 100px;
    flex-basis: 100px;
  }
}
</style>