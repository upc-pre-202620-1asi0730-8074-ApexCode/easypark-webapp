<script setup>
import {
  computed,
  ref,
  watch
} from "vue";

import {useI18n} from "vue-i18n";

import useAnalyticsReportingStore from "../../application/analytics-reporting.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";

import {easyParkUiLabels} from "../../../shared/presentation/easypark-ui-labels.js";

const {locale} = useI18n();

const store =
    useAnalyticsReportingStore();

const profilesStore =
    useProfilesStore();

const labels = computed(() =>
    easyParkUiLabels(locale.value)
);

function inputDate(date) {
  const year =
      date.getFullYear();

  const month =
      String(
          date.getMonth() + 1
      ).padStart(2, '0');

  const day =
      String(
          date.getDate()
      ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const today =
    new Date();

const sevenDaysAgo =
    new Date();

sevenDaysAgo.setDate(
    sevenDaysAgo.getDate() - 6
);

const startDate =
    ref(
        inputDate(sevenDaysAgo)
    );

const endDate =
    ref(
        inputDate(today)
    );

const selectedFacilityId =
    ref(null);

const facilityOptions = computed(() =>
    store.facilities.map(
        facility => ({
          label:
          facility.name,
          value:
          facility.id
        })
    )
);

watch(
    () =>
        profilesStore.currentProfile?.id,

    async profileId => {
      if (!profileId) {
        return;
      }

      await store.fetchFacilities(
          profileId
      );

      if (store.facilities.length) {
        selectedFacilityId.value =
            store.facilities[0].id;

        await store.selectFacility(
            selectedFacilityId.value
        );
      }
    },

    {
      immediate: true
    }
);

async function changeFacility(value) {
  selectedFacilityId.value =
      value;

  await store.selectFacility(
      value
  );
}

function withinPeriod(value) {
  if (!value) return false;

  const date =
      new Date(value);

  const start =
      new Date(
          `${startDate.value}T00:00:00`
      );

  const end =
      new Date(
          `${endDate.value}T23:59:59.999`
      );

  return (
      date >= start &&
      date <= end
  );
}

function movementById(id) {
  return store.movements.find(
      movement =>
          String(movement.id) ===
          String(id)
  ) ?? null;
}

const periodMetrics = computed(() =>
    store.metrics.filter(
        metric =>
            withinPeriod(
                metric.measuredAt
            )
    )
);

const averageOccupancy = computed(() => {
  if (!periodMetrics.value.length) {
    return Number(
        store.currentOccupancyRate || 0
    );
  }

  return Number(
      (
          periodMetrics.value.reduce(
              (total, metric) =>
                  total +
                  Number(
                      metric.occupancyRate ||
                      0
                  ),
              0
          ) /
          periodMetrics.value.length
      ).toFixed(1)
  );
});

const periodStays = computed(() =>
    store.stays.filter(stay => {
      const entry =
          movementById(
              stay.entryMovementId
          );

      const exit =
          stay.exitMovementId
              ? movementById(
                  stay.exitMovementId
              )
              : null;

      return (
          entry &&
          (
              withinPeriod(
                  entry.occurredAt
              ) ||
              (
                  exit &&
                  withinPeriod(
                      exit.occurredAt
                  )
              )
          )
      );
    })
);

const totalRevenue = computed(() =>
    periodStays.value.reduce(
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
              !withinPeriod(
                  exit.occurredAt
              )
          ) {
            return total;
          }

          return total +
              Number(
                  stay.chargedAmount ||
                  0
              );
        },
        0
    )
);

const completedReservations =
    computed(
        () =>
            periodStays.value.filter(
                stay =>
                    stay.reservationId &&
                    stay.exitMovementId
            ).length
    );

const incidents = computed(() =>
    store.movements.filter(
        movement =>
            withinPeriod(
                movement.occurredAt
            ) &&
            movement.status !==
            'COMPLETED'
    ).length
);

const dailyRevenue = computed(() => {
  const start =
      new Date(
          `${startDate.value}T00:00:00`
      );

  const end =
      new Date(
          `${endDate.value}T00:00:00`
      );

  const result = [];

  const current =
      new Date(start);

  while (
      current <= end &&
      result.length < 31
      ) {
    const day =
        inputDate(current);

    result.push({
      day,
      label:
          new Intl.DateTimeFormat(
              locale.value,
              {
                weekday: 'short'
              }
          ).format(current),
      value: 0
    });

    current.setDate(
        current.getDate() + 1
    );
  }

  for (const stay of periodStays.value) {
    if (!stay.exitMovementId) {
      continue;
    }

    const exit =
        movementById(
            stay.exitMovementId
        );

    if (!exit) {
      continue;
    }

    const key =
        inputDate(
            new Date(
                exit.occurredAt
            )
        );

    const item =
        result.find(
            day =>
                day.day === key
        );

    if (item) {
      item.value +=
          Number(
              stay.chargedAmount ||
              0
          );
    }
  }

  return result;
});

const chartPoints = computed(() => {
  const values =
      dailyRevenue.value;

  if (!values.length) {
    return '';
  }

  const width = 560;
  const height = 180;
  const left = 20;
  const right = 20;
  const top = 20;
  const bottom = 20;

  const max =
      Math.max(
          ...values.map(
              item =>
                  item.value
          ),
          1
      );

  return values.map(
      (item, index) => {
        const x =
            values.length === 1
                ? width / 2
                : left +
                (
                    index /
                    (
                        values.length -
                        1
                    )
                ) *
                (
                    width -
                    left -
                    right
                );

        const y =
            height -
            bottom -
            (
                item.value /
                max
            ) *
            (
                height -
                top -
                bottom
            );

        return `${x},${y}`;
      }
  ).join(' ');
});

const occupancyBarHeight =
    computed(
        () =>
            Math.max(
                8,
                Math.min(
                    100,
                    averageOccupancy.value
                )
            )
    );

function exportReport() {
  const rows = [
    [
      labels.value.reports.zone,
      labels.value.reports.spaces,
      labels.value.reports.occupancy,
      labels.value.reports.revenue,
      labels.value.reports.incidents
    ],
    [
      store.currentFacility?.name ??
      '—',

      store.spots.length,

      `${averageOccupancy.value}%`,

      totalRevenue.value.toFixed(2),

      incidents.value
    ]
  ];

  const csv =
      rows
          .map(
              row =>
                  row
                      .map(
                          value =>
                              `"${String(value).replaceAll(
                                  '"',
                                  '""'
                              )}"`
                      )
                      .join(',')
          )
          .join('\n');

  const blob =
      new Blob(
          [csv],
          {
            type:
                'text/csv;charset=utf-8'
          }
      );

  const url =
      URL.createObjectURL(
          blob
      );

  const link =
      document.createElement(
          'a'
      );

  link.href = url;

  link.download =
      'easypark-report.csv';

  document.body.appendChild(
      link
  );

  link.click();
  link.remove();

  URL.revokeObjectURL(
      url
  );
}
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ labels.reports.title }}
        </h1>

        <p class="page-subtitle">
          {{ labels.reports.subtitle }}
        </p>
      </div>

      <pv-button
          :label="
            labels.reports.export
          "
          icon="pi pi-download"
          :disabled="
            !store.currentFacility
          "
          @click="exportReport"/>
    </div>

    <div class="report-toolbar">
      <input
          v-model="startDate"
          type="date"
          class="report-date"/>

      <input
          v-model="endDate"
          type="date"
          class="report-date"/>

      <pv-select
          :model-value="
            selectedFacilityId
          "
          :options="
            facilityOptions
          "
          option-label="label"
          option-value="value"
          @update:model-value="
            changeFacility
          "/>
    </div>

    <div
        v-if="
          !store.facilitiesLoaded ||
          (
            store.currentFacility &&
            !store.analyticsLoaded
          )
        "
        class="panel">

      <p class="empty-state">
        Loading...
      </p>
    </div>

    <template v-else-if="store.currentFacility">
      <div class="report-summary">
        <article class="panel report-card">
          <span>
            {{ labels.reports.revenue }}
          </span>

          <strong class="report-value--primary">
            S/
            {{
              totalRevenue.toFixed(2)
            }}
          </strong>
        </article>

        <article class="panel report-card">
          <span>
            {{ labels.reports.occupancy }}
          </span>

          <strong class="report-value--success">
            {{ averageOccupancy }}%
          </strong>
        </article>

        <article class="panel report-card">
          <span>
            {{ labels.reports.completed }}
          </span>

          <strong>
            {{ completedReservations }}
          </strong>
        </article>

        <article class="panel report-card">
          <span>
            {{ labels.reports.cancellation }}
          </span>

          <strong class="report-value--warning">
            —
          </strong>
        </article>
      </div>

      <div class="report-charts">
        <section class="panel report-chart">
          <h2 class="panel-title">
            {{ labels.reports.occupancyByZone }}
          </h2>

          <div class="bar-chart">
            <div class="bar-chart__bar-area">
              <div
                  class="bar-chart__bar"
                  :style="{
                    height:
                      `${occupancyBarHeight}%`
                  }">
              </div>
            </div>

            <span>
              {{ store.currentFacility.name }}
            </span>

            <strong>
              {{ averageOccupancy }}%
            </strong>
          </div>
        </section>

        <section class="panel report-chart">
          <h2 class="panel-title">
            {{ labels.reports.revenueByDay }}
          </h2>

          <div class="line-chart">
            <svg
                viewBox="0 0 560 180"
                role="img">

              <line
                  x1="20"
                  y1="160"
                  x2="540"
                  y2="160"
                  stroke="#e5e7eb"
                  stroke-width="1"/>

              <polyline
                  v-if="chartPoints"
                  :points="chartPoints"
                  fill="none"
                  stroke="#2563eb"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round"/>
            </svg>

            <div class="line-chart__labels">
              <span
                  v-for="day in dailyRevenue"
                  :key="day.day">
                {{ day.label }}
              </span>
            </div>
          </div>
        </section>
      </div>

      <section class="panel report-table-panel">
        <h2 class="panel-title">
          {{ labels.reports.summary }}
        </h2>

        <div class="report-table-wrap">
          <table class="report-table">
            <thead>
            <tr>
              <th>
                {{ labels.reports.zone }}
              </th>

              <th>
                {{ labels.reports.spaces }}
              </th>

              <th>
                {{ labels.reports.occupancy }}
              </th>

              <th>
                {{ labels.reports.revenue }}
              </th>

              <th>
                {{ labels.reports.incidents }}
              </th>
            </tr>
            </thead>

            <tbody>
            <tr>
              <td>
                <strong>
                  {{ store.currentFacility.name }}
                </strong>
              </td>

              <td>
                {{ store.spots.length }}
              </td>

              <td>
                {{ averageOccupancy }}%
              </td>

              <td>
                S/
                {{ totalRevenue.toFixed(2) }}
              </td>

              <td>
                {{ incidents }}
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <section
        v-else
        class="panel">

      <p class="empty-state">
        No parking facilities.
      </p>
    </section>
  </section>
</template>

<style scoped>
.report-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.report-date {
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid var(--ep-border);
  border-radius: 8px;
  background: var(--ep-surface);
  color: var(--ep-text);
  font: inherit;
}

.report-summary {
  display: grid;
  grid-template-columns:
      repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.report-card {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.report-card span {
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.report-card strong {
  font-size: 25px;
}

.report-value--primary {
  color: var(--ep-primary);
}

.report-value--success {
  color: var(--ep-success);
}

.report-value--warning {
  color: var(--ep-warning);
}

.report-charts {
  display: grid;
  grid-template-columns:
      repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.report-chart {
  min-height: 300px;
}

.report-chart .panel-title {
  margin-bottom: 22px;
}

.bar-chart {
  display: grid;
  grid-template-columns:
      110px
      auto;
  grid-template-rows:
      200px
      auto;
  align-items: end;
  justify-content: center;
  gap: 10px 30px;
}

.bar-chart__bar-area {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  height: 200px;
}

.bar-chart__bar {
  width: 44px;
  min-height: 8px;
  border-radius: 6px 6px 0 0;
  background: var(--ep-primary);
}

.bar-chart span {
  color: var(--ep-text-secondary);
  text-align: center;
  font-size: 11px;
}

.bar-chart strong {
  grid-row: 1;
  grid-column: 2;
  align-self: center;
  font-size: 28px;
}

.line-chart svg {
  display: block;
  width: 100%;
  height: 190px;
}

.line-chart__labels {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  color: var(--ep-text-tertiary);
  font-size: 10px;
}

.report-table-panel {
  overflow: hidden;
}

.report-table-panel > .panel-title {
  margin-bottom: 18px;
}

.report-table-wrap {
  overflow-x: auto;
  margin: 0 -24px -24px;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
}

.report-table th {
  padding: 12px 24px;
  background: var(--ep-page);
  color: var(--ep-text-secondary);
  font-size: 10px;
  text-align: left;
  text-transform: uppercase;
}

.report-table td {
  padding: 14px 24px;
  border-top: 1px solid var(--ep-border);
}

@media (max-width: 900px) {
  .report-summary {
    grid-template-columns:
        repeat(2, minmax(0, 1fr));
  }

  .report-charts {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .report-summary {
    grid-template-columns: 1fr;
  }

  .report-toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>