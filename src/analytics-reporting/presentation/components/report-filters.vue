<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";

import useAnalyticsReportingStore from "../../application/analytics-reporting.store.js";
import useIamStore from "../../../iam/application/iam.store.js";

import {DateRange} from "../../domain/model/date-range.js";
import {ReportType} from "../../domain/model/report-type.js";
import {GenerateReportCommand} from "../../domain/model/generate-report.command.js";

const {t} = useI18n();
const toast = useToast();

const store =
    useAnalyticsReportingStore();

const iamStore =
    useIamStore();

const loading = ref(false);

function toInputDate(date) {
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

const initialStart =
    new Date();

initialStart.setDate(
    initialStart.getDate() - 7
);

const startDate =
    ref(
        toInputDate(initialStart)
    );

const endDate =
    ref(
        toInputDate(today)
    );

const maxDate =
    toInputDate(today);

const reportType =
    ref(ReportType.OCCUPANCY);

const typeOptions = computed(() => [
  {
    label:
        t(
            'analytics-reporting.types.OCCUPANCY'
        ),
    value:
    ReportType.OCCUPANCY
  },
  {
    label:
        t(
            'analytics-reporting.types.MOVEMENTS'
        ),
    value:
    ReportType.MOVEMENTS
  },
  {
    label:
        t(
            'analytics-reporting.types.REVENUE'
        ),
    value:
    ReportType.REVENUE
  },
  {
    label:
        t(
            'analytics-reporting.types.STAY_TIME'
        ),
    value:
    ReportType.STAY_TIME
  }
]);

async function generate() {
  if (
      !store.currentFacility ||
      !startDate.value ||
      !endDate.value
  ) {
    return;
  }

  const period =
      new DateRange({
        start:
            `${startDate.value}T00:00:00`,
        end:
            `${endDate.value}T23:59:59.999`
      });

  if (!period.isValid) {
    toast.add({
      severity: 'error',
      summary:
          t(
              'analytics-reporting.errors.invalid-period'
          ),
      life: 4000
    });

    return;
  }

  loading.value = true;

  const result =
      await store.generateReport(
          new GenerateReportCommand({
            operatorId:
            iamStore.currentUserId,

            parkingFacilityId:
            store.currentFacility.id,

            type:
            reportType.value,

            period
          })
      );

  loading.value = false;

  if (result.success) {
    toast.add({
      severity: 'success',
      summary:
          t(
              'analytics-reporting.messages.generated'
          ),
      life: 3000
    });

    return;
  }

  toast.add({
    severity: 'error',
    summary:
        t(
            `analytics-reporting.errors.${result.reason ?? 'failed'}`
        ),
    life: 4000
  });
}

function exportCsv() {
  const report =
      store.currentReport;

  if (!report) {
    return;
  }

  const csv =
      report.exportToCsv();

  const blob =
      new Blob(
          [csv],
          {
            type:
                'text/csv;charset=utf-8;'
          }
      );

  const url =
      URL.createObjectURL(blob);

  const link =
      document.createElement('a');

  link.href = url;

  link.download =
      `easypark-report-${startDate.value}-${endDate.value}.csv`;

  document.body.appendChild(link);

  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}
</script>

<template>
  <section class="panel">
    <div class="report-filters">
      <div class="report-field">
        <label>
          {{
            t(
                'analytics-reporting.fields.report-type'
            )
          }}
        </label>

        <pv-select
            v-model="reportType"
            :options="typeOptions"
            option-label="label"
            option-value="value"/>
      </div>

      <div class="report-field">
        <label>
          {{
            t(
                'analytics-reporting.fields.start-date'
            )
          }}
        </label>

        <input
            v-model="startDate"
            class="report-date"
            type="date"
            :max="maxDate"/>
      </div>

      <div class="report-field">
        <label>
          {{
            t(
                'analytics-reporting.fields.end-date'
            )
          }}
        </label>

        <input
            v-model="endDate"
            class="report-date"
            type="date"
            :max="maxDate"/>
      </div>

      <div class="report-actions">
        <pv-button
            :label="
              t(
                  'analytics-reporting.actions.generate'
              )
            "
            :loading="loading"
            @click="generate"/>

        <pv-button
            v-if="store.currentReport"
            :label="
              t(
                  'analytics-reporting.actions.export'
              )
            "
            outlined
            @click="exportCsv"/>
      </div>
    </div>
  </section>
</template>

<style scoped>
.report-filters {
  display: grid;
  grid-template-columns:
      1.5fr 1fr 1fr auto;
  gap: 16px;
  align-items: end;
}

.report-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report-field label {
  font-size: 13px;
  font-weight: 600;
}

.report-date {
  min-height: 42px;
  padding: 0 12px;
  border:
      1px solid var(--ep-border);
  border-radius: 8px;
  color: var(--ep-text);
  background: var(--ep-surface);
  font: inherit;
}

.report-actions {
  display: flex;
  gap: 8px;
}

@media (max-width: 900px) {
  .report-filters {
    grid-template-columns: 1fr;
  }

  .report-actions {
    flex-wrap: wrap;
  }
}
</style>