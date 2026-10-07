<script setup>
import {computed, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import useProfilesStore from "../../../profiles/application/profiles.store.js";
import useParkingManagementStore from "../../application/parking-management.store.js";
import FacilityFormDialog from "../components/facility-form-dialog.vue";
import SpotList from "../components/spot-list.vue";

const {t} = useI18n();
const route = useRoute();
const profilesStore = useProfilesStore();
const store = useParkingManagementStore();

const dialogVisible = ref(false);

const facilityId = computed(() => Number(route.params.facilityId));
const operatorProfileId = computed(() => profilesStore.currentProfile?.id ?? null);
const facility = computed(() => store.currentFacility);

const occupiedSpots = computed(() => store.spots.filter(spot => spot.status === 'OCCUPIED').length);

/**
 * Share of spaces with a vehicle inside, the same figure the access control view reports.
 */
const occupancyRate = computed(() =>
    store.spots.length ? Math.round((occupiedSpots.value / store.spots.length) * 100) : 0);

const occupancyTone = computed(() => {
  if (occupancyRate.value >= 90) return 'danger';
  if (occupancyRate.value >= 75) return 'warning';
  return 'success';
});

const coordinates = computed(() => {
  const {latitude, longitude} = facility.value ?? {};
  return latitude == null || longitude == null ? '—' : `${latitude}, ${longitude}`;
});

watch([operatorProfileId, facilityId], async ([id]) => {
  if (!id) return;
  if (!store.facilitiesLoaded) await store.fetchFacilities(id);
  await store.selectFacility(facilityId.value);
}, {immediate: true});

function statusTone(status) {
  return {ACTIVE: 'success', INACTIVE: 'muted', MAINTENANCE: 'warning'}[status] ?? 'muted';
}
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <router-link :to="{name: 'parking-management-facilities'}" class="page-eyebrow">
          <i class="pi pi-arrow-left" aria-hidden="true"></i>
          {{ t('parking-management.facility-detail.back') }}
        </router-link>
        <div v-if="facility" class="facility-heading">
          <h1 class="page-title">{{ facility.name }}</h1>
          <span class="status-badge" :class="`status-badge--${statusTone(facility.status)}`">
            {{ t(`parking-management.facilities.status.${facility.status}`) }}
          </span>
        </div>
        <p v-if="facility" class="page-subtitle">{{ facility.address }}</p>
      </div>
      <pv-button v-if="facility" :label="t('parking-management.facility-detail.edit')" icon="pi pi-pencil"
                 severity="secondary" outlined @click="dialogVisible = true"/>
    </div>

    <div v-if="!store.facilitiesLoaded" class="panel" aria-busy="true">
      <p class="empty-state">{{ t('parking-management.facilities.loading') }}</p>
    </div>

    <div v-else-if="!facility" class="panel">
      <div class="empty">
        <span class="icon-chip icon-chip--lg icon-chip--muted" aria-hidden="true"><i class="pi pi-building"></i></span>
        <p class="empty__text">{{ t('parking-management.facility-detail.not-found') }}</p>
      </div>
    </div>

    <template v-else>
      <div class="stat-grid">
        <article class="stat-card">
          <span class="icon-chip icon-chip--info" aria-hidden="true"><i class="pi pi-th-large"></i></span>
          <div class="stat-card__body">
            <span class="stat-card__label">{{ t('parking-management.facility-detail.stats.total') }}</span>
            <strong class="stat-card__value">{{ facility.totalSpots }}</strong>
          </div>
        </article>
        <article class="stat-card">
          <span class="icon-chip icon-chip--success" aria-hidden="true"><i class="pi pi-check-circle"></i></span>
          <div class="stat-card__body">
            <span class="stat-card__label">{{ t('parking-management.facility-detail.stats.available') }}</span>
            <strong class="stat-card__value">{{ facility.availableSpots }}</strong>
          </div>
        </article>
        <article class="stat-card">
          <span class="icon-chip icon-chip--warning" aria-hidden="true"><i class="pi pi-car"></i></span>
          <div class="stat-card__body">
            <span class="stat-card__label">{{ t('parking-management.facility-detail.stats.occupied') }}</span>
            <strong class="stat-card__value">{{ occupiedSpots }}</strong>
          </div>
        </article>
        <article class="stat-card">
          <span class="icon-chip" :class="`icon-chip--${occupancyTone}`" aria-hidden="true"><i class="pi pi-gauge"></i></span>
          <div class="stat-card__body facility-occupancy">
            <span class="stat-card__label">{{ t('parking-management.facility-detail.occupancy') }}</span>
            <strong class="stat-card__value">{{ occupancyRate }}%</strong>
            <div class="meter" aria-hidden="true">
              <div class="meter__fill" :class="`meter__fill--${occupancyTone}`" :style="{ width: `${occupancyRate}%` }"></div>
            </div>
          </div>
        </article>
      </div>

      <div class="split facility-layout">
        <spot-list v-if="store.spotsLoaded"/>
        <div v-else class="panel" aria-busy="true">
          <p class="empty-state">{{ t('parking-management.facilities.loading') }}</p>
        </div>

        <section class="panel" aria-labelledby="facility-info-title">
          <h2 id="facility-info-title" class="panel-title facility-info__title">
            {{ t('parking-management.facility-detail.info-title') }}
          </h2>
          <dl class="facility-info">
            <div class="facility-info__row">
              <span class="icon-chip icon-chip--sm icon-chip--muted" aria-hidden="true"><i class="pi pi-map-marker"></i></span>
              <div>
                <dt>{{ t('parking-management.fields.address') }}</dt>
                <dd>{{ facility.address }}</dd>
              </div>
            </div>
            <div class="facility-info__row">
              <span class="icon-chip icon-chip--sm icon-chip--muted" aria-hidden="true"><i class="pi pi-clock"></i></span>
              <div>
                <dt>{{ t('parking-management.facility-detail.schedule') }}</dt>
                <dd>{{ facility.openTime }} – {{ facility.closeTime }}</dd>
              </div>
            </div>
            <div class="facility-info__row">
              <span class="icon-chip icon-chip--sm icon-chip--muted" aria-hidden="true"><i class="pi pi-wallet"></i></span>
              <div>
                <dt>{{ t('parking-management.facility-detail.rate') }}</dt>
                <dd>S/ {{ facility.hourlyRate.toFixed(2) }}</dd>
              </div>
            </div>
            <div class="facility-info__row">
              <span class="icon-chip icon-chip--sm icon-chip--muted" aria-hidden="true"><i class="pi pi-compass"></i></span>
              <div>
                <dt>{{ t('parking-management.facility-detail.coordinates') }}</dt>
                <dd>{{ coordinates }}</dd>
              </div>
            </div>
          </dl>
        </section>
      </div>
    </template>
  </section>

  <facility-form-dialog v-if="facility" v-model:visible="dialogVisible" :operator-profile-id="facility.operatorProfileId"/>
</template>

<style scoped>
.facility-heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.facility-occupancy {
  flex: 1;
}

.facility-occupancy .meter {
  margin-top: 6px;
}

.facility-layout {
  grid-template-columns: minmax(0, 2.2fr) minmax(0, 1fr);
}

.facility-info__title {
  margin-bottom: 16px;
}

.facility-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
}

.facility-info__row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.facility-info dt {
  color: var(--ep-text-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.facility-info dd {
  margin: 2px 0 0;
  color: var(--ep-text);
  font-size: 13px;
  font-weight: 500;
  overflow-wrap: anywhere;
}

@media (max-width: 1100px) {
  .facility-layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
