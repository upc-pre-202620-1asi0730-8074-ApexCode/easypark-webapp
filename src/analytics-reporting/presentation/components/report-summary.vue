<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";

import useAnalyticsReportingStore from "../../application/analytics-reporting.store.js";

const {t} = useI18n();

const store =
    useAnalyticsReportingStore();

const report =
    computed(
        () => store.currentReport
    );

const totalRevenue =
    computed(
        () =>
            report.value
                ?.totalRevenue() ?? 0
    );

const averageOccupancy =
    computed(
        () =>
            report.value
                ?.averageOccupancy() ?? 0
    );
</script>

<template>
  <div
      v-if="report"
      class="report-summary">

    <article class="panel report-summary__card">
      <span>
        {{
          t(
              'analytics-reporting.summary.movements'
          )
        }}
      </span>

      <strong>
        {{
          store.currentReportMovements.length
        }}
      </strong>
    </article>

    <article class="panel report-summary__card">
      <span>
        {{
          t(
              'analytics-reporting.summary.occupancy'
          )
        }}
      </span>

      <strong>
        {{ averageOccupancy }}%
      </strong>
    </article>

    <article class="panel report-summary__card">
      <span>
        {{
          t(
              'analytics-reporting.summary.stays'
          )
        }}
      </span>

      <strong>
        {{
          store.currentReportStays.length
        }}
      </strong>
    </article>

    <article class="panel report-summary__card">
      <span>
        {{
          t(
              'analytics-reporting.summary.revenue'
          )
        }}
      </span>

      <strong>
        S/ {{ totalRevenue.toFixed(2) }}
      </strong>
    </article>
  </div>
</template>

<style scoped>
.report-summary {
  display: grid;
  grid-template-columns:
      repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.report-summary__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-summary__card span {
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.report-summary__card strong {
  font-size: 24px;
  color: var(--ep-text);
}

@media (max-width: 767px) {
  .report-summary {
    grid-template-columns:
        repeat(2, minmax(0, 1fr));
  }
}
</style>