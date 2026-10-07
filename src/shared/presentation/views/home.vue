<script setup>
import {computed, ref, watch} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";

import useIamStore from "../../../iam/application/iam.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";
import useReservationsStore from "../../../reservations/application/reservations.store.js";
import useMonitoringAlertsStore from "../../../monitoring-alerts/application/monitoring-alerts.store.js";

import {easyParkUiLabels} from "../easypark-ui-labels.js";

const {t, locale} = useI18n();
const router = useRouter();

const iamStore = useIamStore();
const profilesStore = useProfilesStore();
const reservationsStore = useReservationsStore();
const monitoringStore = useMonitoringAlertsStore();

const labels = computed(() =>
    easyParkUiLabels(locale.value)
);

const search = ref('');
const availabilityFilter = ref('ALL');
const rateFilter = ref('ALL');
const sortFilter = ref('NAME');

const sameId = (a, b) =>
    a != null &&
    b != null &&
    String(a) === String(b);

watch(
    [
      () => iamStore.isSignedIn,
      () => iamStore.isOperator,
      () => profilesStore.currentProfile?.id
    ],
    async ([signedIn, isOperator, profileId]) => {
      if (!signedIn) return;

      if (isOperator) {
        if (!profileId) return;

        await monitoringStore.fetchFacilities(profileId);
        await monitoringStore.selectFacility('all');
        return;
      }

      await reservationsStore.fetchFacilities();
    },
    {
      immediate: true
    }
);

const availabilityOptions = computed(() => [
  {
    label: `${labels.value.search.availability}: ${labels.value.search.all}`,
    value: 'ALL'
  },
  {
    label: labels.value.search.available,
    value: 'AVAILABLE'
  },
  {
    label: labels.value.search.full,
    value: 'FULL'
  }
]);

const rateOptions = computed(() => [
  {
    label: `${labels.value.search.rate}: ${labels.value.search.anyRate}`,
    value: 'ALL'
  },
  {
    label: labels.value.search.lowRate,
    value: 'LOW'
  },
  {
    label: labels.value.search.mediumRate,
    value: 'MEDIUM'
  },
  {
    label: labels.value.search.highRate,
    value: 'HIGH'
  }
]);

const sortOptions = computed(() => [
  {
    label: `${labels.value.search.sort}: ${labels.value.search.name}`,
    value: 'NAME'
  },
  {
    label: `${labels.value.search.sort}: ${labels.value.search.priceLow}`,
    value: 'PRICE_ASC'
  },
  {
    label: `${labels.value.search.sort}: ${labels.value.search.priceHigh}`,
    value: 'PRICE_DESC'
  }
]);

const filteredFacilities = computed(() => {
  const term =
      search.value
          .trim()
          .toLocaleLowerCase(locale.value);

  const result =
      reservationsStore.facilities.filter(facility => {
        const matchesSearch =
            !term ||
            facility.name
                .toLocaleLowerCase(locale.value)
                .includes(term) ||
            facility.address
                .toLocaleLowerCase(locale.value)
                .includes(term);

        const matchesAvailability =
            availabilityFilter.value === 'ALL' ||
            (
                availabilityFilter.value === 'AVAILABLE' &&
                facility.availableSpots > 0
            ) ||
            (
                availabilityFilter.value === 'FULL' &&
                facility.availableSpots === 0
            );

        const rate = Number(facility.hourlyRate);

        const matchesRate =
            rateFilter.value === 'ALL' ||
            (
                rateFilter.value === 'LOW' &&
                rate <= 5
            ) ||
            (
                rateFilter.value === 'MEDIUM' &&
                rate > 5 &&
                rate <= 8
            ) ||
            (
                rateFilter.value === 'HIGH' &&
                rate > 8
            );

        return matchesSearch &&
            matchesAvailability &&
            matchesRate;
      });

  return [...result].sort((a, b) => {
    if (sortFilter.value === 'PRICE_ASC') {
      return Number(a.hourlyRate) -
          Number(b.hourlyRate);
    }

    if (sortFilter.value === 'PRICE_DESC') {
      return Number(b.hourlyRate) -
          Number(a.hourlyRate);
    }

    return a.name.localeCompare(
        b.name,
        locale.value
    );
  });
});

function openFacility(facility) {
  router.push({
    name: 'reservations-parking-detail',
    params: {
      facilityId: facility.id
    }
  });
}

function markerStyle(facility, index) {
  const facilities =
      filteredFacilities.value;

  const valid =
      facilities.filter(item =>
          Number.isFinite(Number(item.latitude)) &&
          Number.isFinite(Number(item.longitude))
      );

  if (
      !Number.isFinite(Number(facility.latitude)) ||
      !Number.isFinite(Number(facility.longitude)) ||
      valid.length < 2
  ) {
    const positions = [
      [26, 28],
      [58, 43],
      [44, 67],
      [70, 78],
      [30, 76],
      [73, 24]
    ];

    const [left, top] =
        positions[index % positions.length];

    return {
      left: `${left}%`,
      top: `${top}%`
    };
  }

  const latitudes =
      valid.map(item =>
          Number(item.latitude)
      );

  const longitudes =
      valid.map(item =>
          Number(item.longitude)
      );

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const latRange =
      Math.max(maxLat - minLat, 0.000001);

  const lngRange =
      Math.max(maxLng - minLng, 0.000001);

  return {
    left:
        `${15 +
        (
            (
                Number(facility.longitude) -
                minLng
            ) /
            lngRange
        ) * 70}%`,

    top:
        `${15 +
        (
            1 -
            (
                (
                    Number(facility.latitude) -
                    minLat
                ) /
                latRange
            )
        ) * 70}%`
  };
}

function spotsFor(facility) {
  return monitoringStore.spots.filter(
      spot =>
          sameId(
              spot.facilityId,
              facility.id
          )
  );
}

function occupancyFor(facility) {
  const spots =
      spotsFor(facility).filter(
          spot =>
              spot.status !== 'OUT_OF_SERVICE'
      );

  if (!spots.length) {
    return 0;
  }

  const occupied =
      spots.filter(
          spot =>
              spot.status === 'OCCUPIED'
      ).length;

  return Math.round(
      occupied / spots.length * 100
  );
}

const totalOccupancy = computed(() => {
  const spots =
      monitoringStore.spots.filter(
          spot =>
              spot.status !== 'OUT_OF_SERVICE'
      );

  if (!spots.length) {
    return 0;
  }

  const occupied =
      spots.filter(
          spot =>
              spot.status === 'OCCUPIED'
      ).length;

  return Math.round(
      occupied / spots.length * 100
  );
});

const availableSpaces = computed(() =>
    monitoringStore.spots.filter(
        spot =>
            spot.status === 'AVAILABLE'
    ).length
);

function movementById(id) {
  return monitoringStore.movements.find(
      movement =>
          sameId(movement.id, id)
  ) ?? null;
}

function isToday(value) {
  if (!value) return false;

  const date = new Date(value);
  const today = new Date();

  return date.getFullYear() ===
      today.getFullYear() &&
      date.getMonth() ===
      today.getMonth() &&
      date.getDate() ===
      today.getDate();
}

const revenueToday = computed(() =>
    monitoringStore.stays.reduce(
        (total, stay) => {
          if (!stay.exitMovementId) {
            return total;
          }

          const exit =
              movementById(
                  stay.exitMovementId
              );

          if (
              !exit ||
              !isToday(exit.occurredAt)
          ) {
            return total;
          }

          return total +
              Number(stay.chargedAmount || 0);
        },
        0
    )
);

const dashboardAlerts = computed(() =>
    monitoringStore.orderedAlerts
        .filter(alert => alert.isActive)
        .slice(0, 3)
);

function facilityOfAlert(alert) {
  return monitoringStore.facilities.find(
      facility =>
          sameId(
              facility.id,
              alert.parkingFacilityId
          )
  );
}

function alertTitle(alert) {
  const facility =
      facilityOfAlert(alert)?.name;

  const type =
      t(
          `monitoring-alerts.types.${alert.type}`
      );

  return facility
      ? `${facility} · ${type}`
      : type;
}

function elapsed(value) {
  if (!value) return '—';

  const minutes =
      Math.max(
          0,
          Math.floor(
              (
                  Date.now() -
                  new Date(value).getTime()
              ) /
              60000
          )
      );

  const formatter =
      new Intl.RelativeTimeFormat(
          locale.value,
          {
            numeric: 'auto'
          }
      );

  if (minutes < 60) {
    return formatter.format(
        -minutes,
        'minute'
    );
  }

  return formatter.format(
      -Math.floor(minutes / 60),
      'hour'
  );
}

function occupancyTone(value) {
  if (value >= 80) {
    return 'danger';
  }

  if (value >= 50) {
    return 'warning';
  }

  return 'success';
}
</script>

<template>
  <section
      v-if="iamStore.isOperator"
      class="page">

    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ labels.dashboard.title }}
        </h1>

        <p class="page-subtitle">
          {{ labels.dashboard.subtitle }}
        </p>
      </div>
    </div>

    <div
        v-if="
          !monitoringStore.facilitiesLoaded ||
          !monitoringStore.monitoringDataLoaded
        "
        class="panel">

      <p class="empty-state">
        {{ t('monitoring-alerts.loading') }}
      </p>
    </div>

    <template v-else>
      <div class="dashboard-summary">
        <article class="panel dashboard-card">
          <span>
            {{ labels.dashboard.occupancy }}
          </span>

          <strong>
            {{ totalOccupancy }}%
          </strong>
        </article>

        <article class="panel dashboard-card">
          <span>
            {{ labels.dashboard.revenue }}
          </span>

          <strong>
            S/ {{ revenueToday.toFixed(2) }}
          </strong>
        </article>

        <article class="panel dashboard-card">
          <span>
            {{ labels.dashboard.alerts }}
          </span>

          <strong class="metric-danger">
            {{ monitoringStore.activeAlerts.length }}
          </strong>
        </article>

        <article class="panel dashboard-card">
          <span>
            {{ labels.dashboard.available }}
          </span>

          <strong class="metric-success">
            {{ availableSpaces }}
          </strong>
        </article>
      </div>

      <div class="dashboard-grid">
        <section class="panel">
          <h2 class="panel-title dashboard-section-title">
            {{ labels.dashboard.occupancyByZone }}
          </h2>

          <div
              v-if="monitoringStore.facilities.length"
              class="zone-occupancy">

            <div
                v-for="facility in monitoringStore.facilities"
                :key="facility.id"
                class="zone-occupancy__row">

              <strong>
                {{ facility.name }}
              </strong>

              <div class="zone-occupancy__track">
                <div
                    class="zone-occupancy__value"
                    :class="
                      `zone-occupancy__value--${occupancyTone(
                        occupancyFor(facility)
                      )}`
                    "
                    :style="{
                      width:
                        `${occupancyFor(facility)}%`
                    }">
                </div>
              </div>

              <span
                  :class="
                    `metric-${occupancyTone(
                      occupancyFor(facility)
                    )}`
                  ">
                {{ occupancyFor(facility) }}%
              </span>
            </div>
          </div>

          <p
              v-else
              class="empty-state">
            {{ t('monitoring-alerts.no-facilities') }}
          </p>
        </section>

        <section class="panel">
          <h2 class="panel-title dashboard-section-title">
            {{ labels.dashboard.activeAlerts }}
          </h2>

          <p
              v-if="!dashboardAlerts.length"
              class="empty-state">
            {{ labels.dashboard.noAlerts }}
          </p>

          <div
              v-else
              class="dashboard-alerts">

            <article
                v-for="alert in dashboardAlerts"
                :key="alert.id"
                class="dashboard-alert">

              <span
                  class="dashboard-alert__icon"
                  :class="
                    alert.severity === 'HIGH'
                      ? 'dashboard-alert__icon--danger'
                      : 'dashboard-alert__icon--warning'
                  ">
                <i class="pi pi-exclamation-triangle"></i>
              </span>

              <div>
                <strong>
                  {{ alertTitle(alert) }}
                </strong>

                <small>
                  {{ elapsed(alert.createdAt) }}
                </small>
              </div>
            </article>
          </div>
        </section>
      </div>
    </template>
  </section>

  <section
      v-else
      class="page">

    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ labels.search.title }}
        </h1>

        <p class="page-subtitle">
          {{ labels.search.subtitle }}
        </p>
      </div>
    </div>

    <div class="search-toolbar">
      <div class="search-box">
        <i class="pi pi-search"></i>

        <pv-input-text
            v-model="search"
            :placeholder="labels.search.placeholder"/>
      </div>

      <pv-select
          v-model="availabilityFilter"
          :options="availabilityOptions"
          option-label="label"
          option-value="value"/>

      <pv-select
          v-model="rateFilter"
          :options="rateOptions"
          option-label="label"
          option-value="value"/>

      <pv-select
          v-model="sortFilter"
          :options="sortOptions"
          option-label="label"
          option-value="value"/>
    </div>

    <div
        v-if="!reservationsStore.facilitiesLoaded"
        class="panel">

      <p class="empty-state">
        {{ t('reservations.create.loading') }}
      </p>
    </div>

    <div
        v-else
        class="driver-search-grid">

      <section class="panel search-results">
        <h2 class="panel-title search-results__title">
          {{ filteredFacilities.length }}
          {{ labels.search.found }}
        </h2>

        <p
            v-if="!filteredFacilities.length"
            class="empty-state">
          {{ labels.search.noResults }}
        </p>

        <button
            v-for="facility in filteredFacilities"
            :key="facility.id"
            type="button"
            class="facility-result"
            @click="openFacility(facility)">

          <div>
            <strong>
              {{ facility.name }}
            </strong>

            <p>
              <i class="pi pi-map-marker"></i>
              {{ facility.address }}
            </p>

            <span
                :class="{
                  'facility-result__available':
                    facility.availableSpots > 0,
                  'facility-result__full':
                    facility.availableSpots === 0
                }">
              {{
                facility.availableSpots > 0
                    ? `${facility.availableSpots} ${labels.search.spacesFree}`
                    : labels.search.noSpaces
              }}
            </span>
          </div>

          <div class="facility-result__rate">
            <strong>
              S/
              {{
                Number(
                    facility.hourlyRate
                ).toFixed(2)
              }}
            </strong>

            <span>
              {{ labels.search.perHour }}
            </span>
          </div>
        </button>
      </section>

      <section class="search-map">
        <button
            v-for="(facility, index) in filteredFacilities"
            :key="facility.id"
            type="button"
            class="search-map__marker"
            :class="{
              'search-map__marker--full':
                facility.availableSpots === 0
            }"
            :style="markerStyle(facility, index)"
            :aria-label="facility.name"
            @click="openFacility(facility)">

          {{
            facility.name
                .charAt(0)
                .toUpperCase()
          }}
        </button>
      </section>
    </div>
  </section>
</template>

<style scoped>
.dashboard-summary {
  display: grid;
  grid-template-columns:
      repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.dashboard-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dashboard-card span {
  font-size: 12px;
  color: var(--ep-text-secondary);
}

.dashboard-card strong {
  font-size: 26px;
}

.metric-success {
  color: var(--ep-success) !important;
}

.metric-danger {
  color: var(--ep-danger) !important;
}

.metric-warning {
  color: var(--ep-warning) !important;
}

.dashboard-grid {
  display: grid;
  grid-template-columns:
      minmax(0, 1.4fr)
      minmax(340px, 1fr);
  gap: 20px;
}

.dashboard-section-title {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ep-border);
}

.zone-occupancy {
  display: flex;
  flex-direction: column;
}

.zone-occupancy__row {
  display: grid;
  grid-template-columns:
      minmax(150px, 190px)
      minmax(120px, 1fr)
      48px;
  align-items: center;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid var(--ep-border);
}

.zone-occupancy__row:last-child {
  border-bottom: 0;
}

.zone-occupancy__row strong {
  font-size: 13px;
}

.zone-occupancy__track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--ep-border);
}

.zone-occupancy__value {
  height: 100%;
  border-radius: inherit;
}

.zone-occupancy__value--success {
  background: var(--ep-success);
}

.zone-occupancy__value--warning {
  background: var(--ep-warning);
}

.zone-occupancy__value--danger {
  background: var(--ep-danger);
}

.dashboard-alerts {
  display: flex;
  flex-direction: column;
}

.dashboard-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 0;
  border-bottom: 1px solid var(--ep-border);
}

.dashboard-alert:last-child {
  border-bottom: 0;
}

.dashboard-alert__icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex: 0 0 36px;
  border-radius: 9px;
}

.dashboard-alert__icon--danger {
  color: var(--ep-danger);
  background: var(--ep-danger-bg);
}

.dashboard-alert__icon--warning {
  color: var(--ep-warning);
  background: var(--ep-warning-bg);
}

.dashboard-alert strong,
.dashboard-alert small {
  display: block;
}

.dashboard-alert strong {
  font-size: 13px;
}

.dashboard-alert small {
  margin-top: 2px;
  color: var(--ep-text-secondary);
}

.search-toolbar {
  display: grid;
  grid-template-columns:
      minmax(280px, 1fr)
      160px
      150px
      190px;
  gap: 12px;
  margin-bottom: 20px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--ep-border);
  border-radius: 8px;
  background: var(--ep-surface);
}

.search-box i {
  color: var(--ep-text-secondary);
}

.search-box :deep(.p-inputtext) {
  border: 0;
  box-shadow: none;
  padding-left: 0;
}

.driver-search-grid {
  display: grid;
  grid-template-columns:
      minmax(0, 1.1fr)
      minmax(380px, .9fr);
  gap: 20px;
}

.search-results {
  padding-top: 20px;
}

.search-results__title {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ep-border);
}

.facility-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  width: 100%;
  padding: 17px 0;
  border: 0;
  border-bottom: 1px solid var(--ep-border);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.facility-result:hover {
  background: var(--ep-page);
}

.facility-result:last-child {
  border-bottom: 0;
}

.facility-result strong {
  font-size: 14px;
}

.facility-result p {
  margin: 5px 0;
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.facility-result__available {
  color: var(--ep-success);
  font-size: 12px;
}

.facility-result__full {
  color: var(--ep-danger);
  font-size: 12px;
}

.facility-result__rate {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  white-space: nowrap;
}

.facility-result__rate strong {
  font-size: 17px;
}

.facility-result__rate span {
  color: var(--ep-text-secondary);
  font-size: 11px;
}

.search-map {
  position: relative;
  min-height: 500px;
  overflow: hidden;
  border: 1px solid #cfe0f5;
  border-radius: 12px;
  background:
      linear-gradient(
          135deg,
          #eaf3ff,
          #d9e9fb
      );
}

.search-map::before,
.search-map::after {
  content: "";
  position: absolute;
  inset: 0;
  background:
      linear-gradient(
          30deg,
          transparent 48%,
          rgba(255,255,255,.45) 49%,
          rgba(255,255,255,.45) 51%,
          transparent 52%
      );
}

.search-map::after {
  transform: rotate(90deg);
}

.search-map__marker {
  position: absolute;
  z-index: 2;
  transform: translate(-50%, -50%);
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 999px;
  background: var(--ep-success);
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.search-map__marker--full {
  background: var(--ep-danger);
}

@media (max-width: 1000px) {
  .dashboard-summary {
    grid-template-columns:
        repeat(2, minmax(0, 1fr));
  }

  .dashboard-grid,
  .driver-search-grid {
    grid-template-columns: 1fr;
  }

  .search-toolbar {
    grid-template-columns:
        repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .dashboard-summary,
  .search-toolbar {
    grid-template-columns: 1fr;
  }

  .zone-occupancy__row {
    grid-template-columns: 1fr 55px;
  }

  .zone-occupancy__track {
    grid-column: 1 / -1;
  }

  .search-map {
    min-height: 360px;
  }
}
</style>