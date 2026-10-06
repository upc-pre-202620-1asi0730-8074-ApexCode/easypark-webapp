<script setup>
import {computed, watch} from "vue";
import {useI18n} from "vue-i18n";

import useMonitoringAlertsStore from "../../application/monitoring-alerts.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";

import AlertList from "../components/alert-list.vue";

const {t} = useI18n();

const store = useMonitoringAlertsStore();
const profilesStore = useProfilesStore();

const facilityOptions = computed(() =>
    store.facilities.map(
        facility => ({
          label: facility.name,
          value: facility.id
        })
    )
);

const selectedFacilityId = computed({
  get() {
    return store.currentFacility?.id ?? null;
  },

  set(value) {
    store.selectFacility(value);
  }
});

watch(
    () => profilesStore.currentProfile?.id,
    async profileId => {
      if (!profileId) return;

      await store.fetchFacilities(profileId);

      if (store.facilities.length) {
        await store.selectFacility(
            store.facilities[0].id
        );
      }
    },
    {
      immediate: true
    }
);
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ t('monitoring-alerts.title') }}
        </h1>

        <p class="page-subtitle">
          {{ t('monitoring-alerts.subtitle') }}
        </p>
      </div>

      <pv-select
          v-if="store.facilities.length"
          v-model="selectedFacilityId"
          :options="facilityOptions"
          :placeholder="t('monitoring-alerts.filter.zone')"
          option-label="label"
          option-value="value"/>
    </div>

    <div
        v-if="!store.facilitiesLoaded"
        class="panel">
      <p class="empty-state">
        {{ t('monitoring-alerts.loading') }}
      </p>
    </div>

    <div
        v-else-if="!store.facilities.length"
        class="panel">
      <p class="empty-state">
        {{ t('monitoring-alerts.no-facilities') }}
      </p>
    </div>

    <template v-else>
      <div class="alerts-summary">
        <article class="panel alerts-summary__card">
          <span>
            {{ t('monitoring-alerts.summary.active') }}
          </span>

          <strong>
            {{ store.activeAlerts.length }}
          </strong>
        </article>

        <article class="panel alerts-summary__card">
          <span>
            {{ t('monitoring-alerts.summary.resolved-today') }}
          </span>

          <strong>
            {{ store.resolvedToday.length }}
          </strong>
        </article>

        <article class="panel alerts-summary__card">
          <span>
            {{ t('monitoring-alerts.summary.avg-resolution') }}
          </span>

          <strong>
            {{ store.avgResolutionMinutes }}
            {{ t('monitoring-alerts.summary.minutes') }}
          </strong>
        </article>
      </div>

      <div
          v-if="!store.monitoringDataLoaded"
          class="panel">
        <p class="empty-state">
          {{ t('monitoring-alerts.loading') }}
        </p>
      </div>

      <alert-list v-else/>
    </template>
  </section>
</template>

<style scoped>
.alerts-summary {
  display: grid;
  grid-template-columns:
      repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.alerts-summary__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alerts-summary__card span {
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.alerts-summary__card strong {
  color: var(--ep-text);
  font-size: 24px;
}

@media (max-width: 767px) {
  .alerts-summary {
    grid-template-columns:
        minmax(0, 1fr);
  }
}
</style>
