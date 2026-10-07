
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

    <div v-if="!store.facilitiesLoaded" class="panel">
      <p class="empty-state">{{ t('monitoring-alerts.loading') }}</p>
    </div>
    <div v-else-if="!store.facilities.length" class="panel">
      <p class="empty-state">{{ store.errors.length
          ? t('monitoring-alerts.errors.failed') : t('monitoring-alerts.no-facilities') }}</p>
    </div>
    <template v-else>
      <div class="alerts-summary">
        <article class="panel alerts-summary__card">
          <span>{{ t('monitoring-alerts.summary.active') }}</span>
          <strong class="alerts-summary__active">{{ store.activeAlerts.length }}</strong>
        </article>
        <article class="panel alerts-summary__card">
          <span>{{ t('monitoring-alerts.summary.resolved-today') }}</span>
          <strong class="alerts-summary__resolved">{{ store.resolvedToday.length }}</strong>
        </article>
        <article class="panel alerts-summary__card">
          <span>{{ labels.average }}</span>
          <strong>{{ store.averageResolutionMinutes == null ? '—' :
              `${store.averageResolutionMinutes} ${labels.minutes}` }}</strong>
        </article>
      </div>

      <div class="alerts-filters">
        <label class="alerts-filters__control">
          <span class="sr-only">{{ labels.state }}</span>
          <pv-select v-model="statusFilter" :options="statusOptions" option-label="label"
                     option-value="value" :aria-label="labels.state"/>
        </label>
        <label class="alerts-filters__control">
          <span class="sr-only">{{ labels.zone }}</span>
          <pv-select v-model="selectedFacilityId" :options="facilityOptions" option-label="label"
                     option-value="value" :aria-label="labels.zone"/>
        </label>
        <label class="alerts-filters__control">
          <span class="sr-only">{{ labels.type }}</span>
          <pv-select v-model="typeFilter" :options="typeOptions" option-label="label"
                     option-value="value" :aria-label="labels.type"/>
        </label>
      </div>

      <div v-if="!store.monitoringDataLoaded" class="panel">
        <p class="empty-state">{{ t('monitoring-alerts.loading') }}</p>
      </div>
      <template v-else>
        <div v-if="store.errors.length" class="panel" role="alert">
          <p class="monitoring-error">{{ labels.unavailable }}</p>
          <pv-button :label="labels.retry" severity="secondary" text icon="pi pi-refresh"
                     @click="store.selectFacility(store.selectedFacilityId)"/>
        </div>
        <alert-list :items="filteredAlerts"/>
      </template>
    </template>

    <alert-rule-dialog v-model:visible="rulesVisible"/>
  </section>
</template>

<style scoped>
.alerts-summary {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-bottom:20px}
.alerts-summary__card {display:flex;flex-direction:column;gap:10px}
.alerts-summary__card span {font-size:12px;color:var(--ep-text-secondary)}
.alerts-summary__card strong {font-size:26px;color:var(--ep-text)}
.alerts-summary__card .alerts-summary__active {color:#dc2626}
.alerts-summary__card .alerts-summary__resolved {color:#16a34a}
.alerts-filters {display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}
.alerts-filters__control {min-width:145px;max-width:300px}
.alerts-filters__control :deep(.p-select) {width:100%}
.monitoring-error {color:#b91c1c;margin-bottom:8px}
.sr-only {position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
@media(max-width:800px){.alerts-summary {grid-template-columns:1fr;gap:12px}}
@media(max-width:600px){.alerts-filters__control {flex:1 1 100%;max-width:none}}
</style>
