
<script setup>
import {computed, ref} from 'vue';
import {useI18n} from 'vue-i18n';
import {useToast} from 'primevue/usetoast';
import useMonitoringAlertsStore from '../../application/monitoring-alerts.store.js';
import useIamStore from '../../../iam/application/iam.store.js';
import {ResolveAlertCommand} from '../../domain/model/resolve-alert.command.js';
import {AlertType} from '../../domain/model/alert-type.js';
import {AlertStatus} from '../../domain/model/alert-status.js';
import {monitoringLabels} from '../monitoring-alerts-labels.js';

const props = defineProps({items: {type: Array, required: true}});
const {t, locale} = useI18n();
const toast = useToast();
const store = useMonitoringAlertsStore();
const iamStore = useIamStore();
const pendingIds = ref(new Set());
const labels = computed(() => monitoringLabels(locale.value));

function elapsed(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return '—';
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 60000));
  if (minutes === 0) return labels.value.justNow;
  const relative = new Intl.RelativeTimeFormat(locale.value, {numeric: 'auto'});
  if (minutes < 60) return relative.format(-minutes, 'minute');
  if (minutes < 1440) return relative.format(-Math.floor(minutes / 60), 'hour');
  return relative.format(-Math.floor(minutes / 1440), 'day');
}

function alertTitle(alert) {
  const facility = store.facilityOf(alert)?.name ?? t(`monitoring-alerts.types.${alert.type}`);
  const plate = store.plateOf(alert);
  const percentage = alert.contextValue == null ? null : Math.round(Number(alert.contextValue) * 100);
  switch (alert.type) {
    case AlertType.CAPACITY_CRITICAL:
      return percentage == null ? t('monitoring-alerts.types.CAPACITY_CRITICAL') :
          `${facility} ${labels.value.zoneCapacity.replace('{value}', percentage)}`;
    case AlertType.CAPACITY_NEAR_LIMIT:
      return `${facility} ${labels.value.nearCapacity}`;
    case AlertType.STAY_EXCEEDED:
      return plate ? `${labels.value.vehicle} ${plate} ${labels.value.overstay}` :
          t('monitoring-alerts.types.STAY_EXCEEDED');
    case AlertType.UNRECOGNIZED_PLATE:
      return plate ? `${labels.value.unknownPlate}: ${plate}` : labels.value.unknownPlate;
    case AlertType.ACCESS_WITHOUT_RESERVATION:
      return plate ? `${labels.value.vehicle} ${plate}: ${labels.value.noReservation}` :
          labels.value.noReservation;
    default:
      return t(`monitoring-alerts.types.${alert.type}`);
  }
}

function alertDetails(alert) {
  const parts = [store.facilityOf(alert)?.name];
  const code = store.spotOf(alert)?.code;
  if (code) parts.push(code);
  const at = alert.status === AlertStatus.RESOLVED ? alert.resolvedAt : alert.createdAt;
  parts.push(`${alert.status === AlertStatus.RESOLVED ? labels.value.resolvedAt : labels.value.detected}: ${elapsed(at)}`);
  return parts.filter(Boolean).join(' · ');
}

function iconOf(alert) {
  if (alert.status === AlertStatus.RESOLVED) return 'pi pi-check-circle';
  switch (alert.type) {
    case AlertType.CAPACITY_CRITICAL: return 'pi pi-exclamation-circle';
    case AlertType.CAPACITY_NEAR_LIMIT: return 'pi pi-exclamation-triangle';
    case AlertType.STAY_EXCEEDED: return 'pi pi-car';
    case AlertType.UNRECOGNIZED_PLATE: return 'pi pi-question-circle';
    case AlertType.ACCESS_WITHOUT_RESERVATION: return 'pi pi-lock';
    default: return 'pi pi-bell';
  }
}

function colorOf(alert) {
  if (alert.status === AlertStatus.RESOLVED) return 'success';
  if (alert.status === AlertStatus.DISMISSED) return 'muted';
  return {HIGH: 'danger', MEDIUM: 'warning', LOW: 'info'}[alert.severity] ?? 'info';
}

function severityTone(alert) {
  return {HIGH: 'danger', MEDIUM: 'warning', LOW: 'info'}[alert.severity] ?? 'info';
}

async function resolve(alert) {
  const id = String(alert.id);
  if (pendingIds.value.has(id)) return;
  pendingIds.value.add(id);
  try {
    const result = await store.resolveAlert(new ResolveAlertCommand({
      alertId: alert.id,
      resolvedBy: iamStore.currentUserId
    }));
    toast.add({
      severity: result.success ? 'success' : 'error',
      summary: result.success ? t('monitoring-alerts.messages.resolved') :
          t(`monitoring-alerts.errors.${result.reason ?? 'failed'}`),
      life: 4000
    });
  } finally {
    pendingIds.value.delete(id);
  }
}
</script>

<template>
  <section class="panel alert-list" aria-labelledby="alert-list-title">
    <div class="panel-header">
      <h2 id="alert-list-title" class="panel-title">
        {{ t('monitoring-alerts.list.title') }}
        <span class="status-badge status-badge--muted alert-list__count">{{ props.items.length }}</span>
      </h2>
    </div>
    <div v-if="!props.items.length" class="empty">
      <span class="icon-chip icon-chip--lg icon-chip--muted" aria-hidden="true"><i class="pi pi-bell-slash"></i></span>
      <p class="empty__text">{{ labels.noAlerts }}</p>
    </div>
    <ul v-else class="alert-list__items">
      <li v-for="alert in props.items" :key="alert.id" class="alert-list__item"
          :class="{ 'alert-list__item--active': alert.isActive }">
        <span class="icon-chip" :class="`icon-chip--${colorOf(alert)}`" aria-hidden="true">
          <i :class="iconOf(alert)"></i>
        </span>
        <div class="alert-list__content">
          <strong>{{ alertTitle(alert) }}</strong>
          <small>{{ alertDetails(alert) }}</small>
        </div>
        <span class="alert-list__severity">
          <span class="status-dot" :class="`status-dot--${severityTone(alert)}`" aria-hidden="true"></span>
          {{ t(`monitoring-alerts.severity.${alert.severity}`) }}
        </span>
        <span class="status-badge alert-list__status" :class="`status-badge--${colorOf(alert)}`">
          {{ t(`monitoring-alerts.status.${alert.status}`) }}
        </span>
        <span class="alert-list__action">
          <pv-button v-if="alert.isActive"
                     :label="t('monitoring-alerts.list.resolve')"
                     icon="pi pi-check"
                     severity="secondary" outlined size="small"
                     :loading="pendingIds.has(String(alert.id))"
                     :disabled="pendingIds.has(String(alert.id))"
                     @click="resolve(alert)"/>
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.alert-list__count {
  margin-left: 8px;
  vertical-align: middle;
}

.alert-list__items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.alert-list__item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid var(--ep-border);
  border-radius: 12px;
}

.alert-list__item--active {
  border-color: var(--ep-border-strong);
  background: var(--ep-page);
}

.alert-list__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.alert-list__content strong {
  color: var(--ep-text);
  font-size: 13px;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.alert-list__content small {
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.alert-list__severity {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: 64px;
  color: var(--ep-text-secondary);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.alert-list__status {
  justify-content: center;
  min-width: 84px;
}

.alert-list__action {
  display: flex;
  justify-content: flex-end;
  width: 112px;
}

@media (max-width: 767px) {
  .alert-list__item {
    flex-wrap: wrap;
  }

  .alert-list__content {
    flex-basis: calc(100% - 56px);
  }

  .alert-list__severity {
    margin-left: 54px;
  }

  .alert-list__action {
    flex: 1;
  }
}
</style>