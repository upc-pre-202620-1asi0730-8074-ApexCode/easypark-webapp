
<script setup>
import {computed, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import useMonitoringAlertsStore from '../../application/monitoring-alerts.store.js';
import useProfilesStore from '../../../profiles/application/profiles.store.js';
import {AlertStatus} from '../../domain/model/alert-status.js';
import {AlertType} from '../../domain/model/alert-type.js';
import {monitoringLabels} from '../monitoring-alerts-labels.js';
import AlertList from '../components/alert-list.vue';
import AlertRuleDialog from '../components/alert-rule-dialog.vue';

const {t, locale} = useI18n();
const store = useMonitoringAlertsStore();
const profilesStore = useProfilesStore();
const labels = computed(() => monitoringLabels(locale.value));
const statusFilter = ref('all');
const typeFilter = ref('all');
const rulesVisible = ref(false);

const facilityOptions = computed(() => [
  {label: labels.value.allZones, value: 'all'},
  ...store.facilities.map(facility => ({label: facility.name, value: facility.id}))
]);
const statusOptions = computed(() => [
  {label: labels.value.all, value: 'all'},
  {label: labels.value.active, value: AlertStatus.ACTIVE},
  {label: labels.value.resolved, value: AlertStatus.RESOLVED},
  {label: labels.value.dismissed, value: AlertStatus.DISMISSED}
]);
const typeOptions = computed(() => [
  {label: labels.value.all, value: 'all'},
  ...Object.values(AlertType).map(type => ({
    label: t(`monitoring-alerts.types.${type}`), value: type
  }))
]);
const selectedFacilityId = computed({
  get: () => store.selectedFacilityId,
  set: value => store.selectFacility(value)
});
const filteredAlerts = computed(() => store.orderedAlerts.filter(alert =>
    (statusFilter.value === 'all' || alert.status === statusFilter.value) &&
    (typeFilter.value === 'all' || alert.type === typeFilter.value)
));

watch(() => profilesStore.currentProfile?.id, async (profileId, _, onCleanup) => {
  let cancelled = false;
  onCleanup(() => {cancelled = true;});
  await store.fetchFacilities(profileId);
  if (!cancelled && store.facilities.length) await store.selectFacility('all');
}, {immediate: true});
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('monitoring-alerts.title') }}</h1>
        <p class="page-subtitle">{{ t('monitoring-alerts.subtitle') }}</p>
      </div>
      <pv-button v-if="store.facilities.length" icon="pi pi-cog"
                 :label="labels.manageRules" severity="secondary" outlined
                 @click="rulesVisible = true"/>
    </div>

    <div v-if="!store.facilitiesLoaded" class="panel" aria-busy="true">
      <p class="empty-state">{{ t('monitoring-alerts.loading') }}</p>
    </div>
    <div v-else-if="!store.facilities.length" class="panel">
      <div class="empty">
        <span class="icon-chip icon-chip--lg icon-chip--muted" aria-hidden="true"><i class="pi pi-building"></i></span>
        <p class="empty__text">{{ store.errors.length
            ? t('monitoring-alerts.errors.failed') : t('monitoring-alerts.no-facilities') }}</p>
      </div>
    </div>
    <template v-else>
      <div class="stat-grid stat-grid--3">
        <article class="stat-card">
          <span class="icon-chip icon-chip--danger" aria-hidden="true"><i class="pi pi-exclamation-triangle"></i></span>
          <div class="stat-card__body">
            <span class="stat-card__label">{{ t('monitoring-alerts.summary.active') }}</span>
            <strong class="stat-card__value stat-card__value--danger">{{ store.activeAlerts.length }}</strong>
          </div>
        </article>
        <article class="stat-card">
          <span class="icon-chip icon-chip--success" aria-hidden="true"><i class="pi pi-check-circle"></i></span>
          <div class="stat-card__body">
            <span class="stat-card__label">{{ t('monitoring-alerts.summary.resolved-today') }}</span>
            <strong class="stat-card__value stat-card__value--success">{{ store.resolvedToday.length }}</strong>
          </div>
        </article>
        <article class="stat-card">
          <span class="icon-chip icon-chip--info" aria-hidden="true"><i class="pi pi-stopwatch"></i></span>
          <div class="stat-card__body">
            <span class="stat-card__label">{{ labels.average }}</span>
            <strong class="stat-card__value">{{ store.averageResolutionMinutes == null ? '—' :
                `${store.averageResolutionMinutes} ${labels.minutes}` }}</strong>
          </div>
        </article>
      </div>

      <div class="filter-bar">
        <label class="field-inline">
          <span class="form-label">{{ labels.state }}</span>
          <pv-select v-model="statusFilter" :options="statusOptions" option-label="label"
                     option-value="value" :aria-label="labels.state"/>
        </label>
        <label class="field-inline">
          <span class="form-label">{{ labels.zone }}</span>
          <pv-select v-model="selectedFacilityId" :options="facilityOptions" option-label="label"
                     option-value="value" :aria-label="labels.zone"/>
        </label>
        <label class="field-inline">
          <span class="form-label">{{ labels.type }}</span>
          <pv-select v-model="typeFilter" :options="typeOptions" option-label="label"
                     option-value="value" :aria-label="labels.type"/>
        </label>
      </div>

      <div v-if="!store.monitoringDataLoaded" class="panel" aria-busy="true">
        <p class="empty-state">{{ t('monitoring-alerts.loading') }}</p>
      </div>
      <template v-else>
        <div v-if="store.errors.length" class="panel monitoring-error" role="alert">
          <span class="icon-chip icon-chip--sm icon-chip--danger" aria-hidden="true"><i class="pi pi-exclamation-circle"></i></span>
          <p class="monitoring-error__text">{{ labels.unavailable }}</p>
          <pv-button :label="labels.retry" severity="secondary" outlined size="small" icon="pi pi-refresh"
                     @click="store.selectFacility(store.selectedFacilityId)"/>
        </div>
        <alert-list :items="filteredAlerts"/>
      </template>
    </template>

    <alert-rule-dialog v-model:visible="rulesVisible"/>
  </section>
</template>

<style scoped>
.monitoring-error {
  display: flex;
  align-items: center;
  gap: 12px;
}

.monitoring-error__text {
  flex: 1;
  margin: 0;
  color: var(--ep-danger-text);
  font-size: 13px;
  font-weight: 500;
}
</style>