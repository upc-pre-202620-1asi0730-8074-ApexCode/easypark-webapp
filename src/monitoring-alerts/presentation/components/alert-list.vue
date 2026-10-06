<script setup>
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";

import useMonitoringAlertsStore from "../../application/monitoring-alerts.store.js";
import useIamStore from "../../../iam/application/iam.store.js";
import {ResolveAlertCommand} from "../../domain/model/resolve-alert.command.js";
import {AlertType} from "../../domain/model/alert-type.js";

const {t, locale} = useI18n();
const toast = useToast();
const store = useMonitoringAlertsStore();
const iamStore = useIamStore();

function formatDate(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat(
      locale.value,
      {
        dateStyle: 'short',
        timeStyle: 'short'
      }
  ).format(new Date(value));
}

function contextValueFor(alert) {
  if (alert.contextValue === null || alert.contextValue === undefined) {
    return '—';
  }

  if (
      alert.type === AlertType.CAPACITY_CRITICAL ||
      alert.type === AlertType.CAPACITY_NEAR_LIMIT
  ) {
    return `${Math.round(alert.contextValue * 100)}%`;
  }

  if (alert.type === AlertType.STAY_EXCEEDED) {
    return `${alert.contextValue} ${t('monitoring-alerts.fields.minutes')}`;
  }

  return '—';
}

function statusClass(status) {
  if (status === 'RESOLVED') {
    return 'status-badge--success';
  }

  if (status === 'DISMISSED') {
    return 'status-badge--info';
  }

  return 'status-badge--danger';
}

function severityClass(severity) {
  if (severity === 'HIGH') {
    return 'status-badge--danger';
  }

  if (severity === 'MEDIUM') {
    return 'status-badge--warning';
  }

  return 'status-badge--info';
}

async function resolve(alert) {
  const result =
      await store.resolveAlert(
          new ResolveAlertCommand({
            alertId: alert.id,
            operatorId: iamStore.currentUserId
          })
      );

  if (!result.success) {
    toast.add({
      severity: 'error',
      summary: t(
          `monitoring-alerts.errors.${result.reason}`
      ),
      life: 4000
    });

    return;
  }

  toast.add({
    severity: 'success',
    summary: t('monitoring-alerts.messages.resolved'),
    life: 4000
  });
}
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <h2 class="panel-title">
        {{ t('monitoring-alerts.list.title') }}
      </h2>
    </div>

    <p
        v-if="!store.alerts.length"
        class="empty-state">
      {{ t('monitoring-alerts.list.empty') }}
    </p>

    <table
        v-else
        class="alert-table">
      <thead>
      <tr>
        <th>{{ t('monitoring-alerts.fields.time') }}</th>
        <th>{{ t('monitoring-alerts.fields.type') }}</th>
        <th>{{ t('monitoring-alerts.fields.severity') }}</th>
        <th>{{ t('monitoring-alerts.fields.value') }}</th>
        <th>{{ t('monitoring-alerts.fields.status') }}</th>
        <th>{{ t('monitoring-alerts.fields.resolution-time') }}</th>
        <th></th>
      </tr>
      </thead>

      <tbody>
      <tr
          v-for="alert in store.alerts"
          :key="alert.id">

        <td>
          {{ formatDate(alert.createdAt) }}
        </td>

        <td>
          {{ t(`monitoring-alerts.types.${alert.type}`) }}
        </td>

        <td>
            <span
                class="status-badge"
                :class="severityClass(alert.severity)">
              {{
                t(
                    `monitoring-alerts.severity.${alert.severity}`
                )
              }}
            </span>
        </td>

        <td>
          {{ contextValueFor(alert) }}
        </td>

        <td>
            <span
                class="status-badge"
                :class="statusClass(alert.status)">
              {{
                t(
                    `monitoring-alerts.status.${alert.status}`
                )
              }}
            </span>
        </td>

        <td>
          {{ alert.resolutionMinutes ?? '—' }}
        </td>

        <td class="alert-table__action">
          <pv-button
              v-if="alert.isActive"
              :label="t('monitoring-alerts.list.resolve')"
              severity="secondary"
              outlined
              size="small"
              @click="resolve(alert)"/>
        </td>
      </tr>
      </tbody>
    </table>
  </section>
</template>

<style scoped>
.alert-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.alert-table th {
  padding: 10px 12px;
  background: var(--ep-page);
  color: var(--ep-text-secondary);
  font-size: 11px;
  text-align: left;
  text-transform: uppercase;
}

.alert-table td {
  padding: 12px;
  border-top: 1px solid var(--ep-border);
}

.alert-table__action {
  text-align: right;
}
</style>
