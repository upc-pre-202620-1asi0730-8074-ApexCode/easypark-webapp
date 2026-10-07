<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";

import useAnalyticsReportingStore from "../../application/analytics-reporting.store.js";
import {ReportType} from "../../domain/model/report-type.js";

const {t, locale} =
    useI18n();

const store =
    useAnalyticsReportingStore();

const isMovementReport =
    computed(
        () =>
            store.currentReport?.type ===
            ReportType.MOVEMENTS
    );

const isStayReport =
    computed(
        () =>
            store.currentReport?.type ===
            ReportType.STAY_TIME
    );

function formatDate(value) {
  if (!value) {
    return '—';
  }

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

function statusClass(status) {
  if (status === 'COMPLETED') {
    return 'report-badge--success';
  }

  if (status === 'REJECTED') {
    return 'report-badge--danger';
  }

  return 'report-badge--warning';
}
</script>

<template>
  <section
      v-if="store.currentReport"
      class="panel">

    <template v-if="isMovementReport">
      <h2 class="panel-title">
        {{
          t(
              'analytics-reporting.movements.title'
          )
        }}
      </h2>

      <p
          v-if="
            !store.currentReportMovements.length
          "
          class="empty-state">
        {{
          t(
              'analytics-reporting.movements.empty'
          )
        }}
      </p>

      <div
          v-else
          class="report-table-wrapper">

        <table class="report-table">
          <thead>
          <tr>
            <th>
              {{
                t(
                    'analytics-reporting.fields.date'
                )
              }}
            </th>

            <th>
              {{
                t(
                    'analytics-reporting.fields.plate'
                )
              }}
            </th>

            <th>
              {{
                t(
                    'analytics-reporting.fields.movement'
                )
              }}
            </th>

            <th>
              {{
                t(
                    'analytics-reporting.fields.method'
                )
              }}
            </th>

            <th>
              {{
                t(
                    'analytics-reporting.fields.status'
                )
              }}
            </th>
          </tr>
          </thead>

          <tbody>
          <tr
              v-for="
                movement
                in store.currentReportMovements
              "
              :key="movement.id">

            <td>
              {{
                formatDate(
                    movement.occurredAt
                )
              }}
            </td>

            <td>
              {{
                store.plateForVehicle(
                    movement.vehicleId
                )
              }}
            </td>

            <td>
              {{
                t(
                    `analytics-reporting.movement-types.${movement.movementType}`
                )
              }}
            </td>

            <td>
              {{ movement.registrationMethod }}
            </td>

            <td>
              <span
                  class="report-badge"
                  :class="
                    statusClass(
                      movement.status
                    )
                  ">
                {{ movement.status }}
              </span>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else-if="isStayReport">
      <h2 class="panel-title">
        {{
          t(
              'analytics-reporting.stays.title'
          )
        }}
      </h2>

      <p
          v-if="
            !store.currentReportStays.length
          "
          class="empty-state">
        {{
          t(
              'analytics-reporting.stays.empty'
          )
        }}
      </p>

      <div
          v-else
          class="report-table-wrapper">

        <table class="report-table">
          <thead>
          <tr>
            <th>
              {{
                t(
                    'analytics-reporting.fields.plate'
                )
              }}
            </th>

            <th>
              {{
                t(
                    'analytics-reporting.fields.entry'
                )
              }}
            </th>

            <th>
              {{
                t(
                    'analytics-reporting.fields.exit'
                )
              }}
            </th>

            <th>
              {{
                t(
                    'analytics-reporting.fields.duration'
                )
              }}
            </th>

            <th>
              {{
                t(
                    'analytics-reporting.fields.revenue'
                )
              }}
            </th>
          </tr>
          </thead>

          <tbody>
          <tr
              v-for="
                stay
                in store.currentReportStays
              "
              :key="stay.id">

            <td>
              {{
                store.plateForStay(stay)
              }}
            </td>

            <td>
              {{
                formatDate(
                    store.movementById(
                        stay.entryMovementId
                    )?.occurredAt
                )
              }}
            </td>

            <td>
              {{
                formatDate(
                    store.movementById(
                        stay.exitMovementId
                    )?.occurredAt
                )
              }}
            </td>

            <td>
              {{
                store.stayDurationMinutes(
                    stay
                )
              }}
              min
            </td>

            <td>
              S/
              {{
                Number(
                    stay.chargedAmount || 0
                ).toFixed(2)
              }}
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>

<style scoped>
.report-table-wrapper {
  margin-top: 20px;
  overflow-x: auto;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
}

.report-table th,
.report-table td {
  padding: 12px;
  border-bottom:
      1px solid var(--ep-border);
  text-align: left;
  font-size: 13px;
}

.report-table th {
  color: var(--ep-text-secondary);
  font-size: 11px;
  text-transform: uppercase;
}

.report-badge {
  display: inline-flex;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}

.report-badge--success {
  color: #15803d;
  background: #dcfce7;
}

.report-badge--danger {
  color: #dc2626;
  background: #fee2e2;
}

.report-badge--warning {
  color: #b45309;
  background: #fef3c7;
}
</style>