<script setup>
import {useI18n} from "vue-i18n";

import useAnalyticsReportingStore from "../../application/analytics-reporting.store.js";

const {t, locale} =
    useI18n();

const store =
    useAnalyticsReportingStore();

function formatDate(value) {
  return new Intl.DateTimeFormat(
      locale.value,
      {
        dateStyle: 'short',
        timeStyle: 'short'
      }
  ).format(
      new Date(value)
  );
}
</script>

<template>
  <section
      v-if="store.currentReport"
      class="panel">

    <h2 class="panel-title">
      {{
        t(
            'analytics-reporting.occupancy.title'
        )
      }}
    </h2>

    <p
        v-if="
          !store.currentReport.metrics.length
        "
        class="empty-state">
      {{
        t(
            'analytics-reporting.empty'
        )
      }}
    </p>

    <div v-else class="occupancy-report">
      <div
          v-for="metric in store.currentReport.metrics"
          :key="metric.id"
          class="occupancy-record">

        <div class="occupancy-record__header">
          <strong>
            {{ metric.occupancyRate }}%
          </strong>

          <span>
            {{ formatDate(metric.measuredAt) }}
          </span>
        </div>

        <div class="occupancy-bar">
          <div
              class="occupancy-bar__value"
              :style="{
                width:
                  `${Math.min(
                    metric.occupancyRate,
                    100
                  )}%`
              }">
          </div>
        </div>

        <div class="occupancy-details">
          <span>
            {{
              t(
                  'analytics-reporting.fields.entries'
              )
            }}:
            {{ metric.entryCount }}
          </span>

          <span>
            {{
              t(
                  'analytics-reporting.fields.exits'
              )
            }}:
            {{ metric.exitCount }}
          </span>

          <span>
            {{
              t(
                  'analytics-reporting.fields.average-stay'
              )
            }}:
            {{ metric.averageStayMinutes }}
            min
          </span>

          <span>
            {{
              t(
                  'analytics-reporting.fields.revenue'
              )
            }}:
            S/
            {{
              Number(
                  metric.revenue
              ).toFixed(2)
            }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.occupancy-report {
  margin-top: 20px;
}

.occupancy-record {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.occupancy-record__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.occupancy-record__header strong {
  font-size: 28px;
}

.occupancy-record__header span,
.occupancy-details {
  color: var(--ep-text-secondary);
}

.occupancy-bar {
  width: 100%;
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--ep-page);
}

.occupancy-bar__value {
  height: 100%;
  border-radius: inherit;
  background: var(--ep-primary);
}

.occupancy-details {
  display: grid;
  grid-template-columns:
      repeat(4, minmax(0, 1fr));
  gap: 16px;
  font-size: 13px;
}

@media (max-width: 767px) {
  .occupancy-details {
    grid-template-columns:
        repeat(2, minmax(0, 1fr));
  }
}
</style>