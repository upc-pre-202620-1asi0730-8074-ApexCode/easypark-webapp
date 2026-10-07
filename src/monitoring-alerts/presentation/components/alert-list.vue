
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
  <section class="panel alert-list">
    <h2 class="panel-title">{{ t('monitoring-alerts.list.title') }}</h2>
    <p v-if="!props.items.length" class="empty-state">{{ labels.noAlerts }}</p>
    <ul v-else class="alert-list__items">
      <li v-for="alert in props.items" :key="alert.id" class="alert-list__item">
        <span class="alert-list__icon" :class="`alert-list__icon--${colorOf(alert)}`" aria-hidden="true">
          <i :class="iconOf(alert)"></i>
        </span>
        <div class="alert-list__content">
          <strong>{{ alertTitle(alert) }}</strong>
          <small>{{ alertDetails(alert) }}</small>
        </div>
        <span class="status-badge alert-list__status" :class="`status-badge--${colorOf(alert)}`">
          {{ t(`monitoring-alerts.status.${alert.status}`) }}
        </span>
        <pv-button v-if="alert.isActive"
                   :label="t('monitoring-alerts.list.resolve')"
                   severity="secondary" outlined size="small"
                   :loading="pendingIds.has(String(alert.id))"
                   :disabled="pendingIds.has(String(alert.id))"
                   @click="resolve(alert)"/>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.alert-list__items {list-style:none;margin:18px 0 0;padding:0}
.alert-list__item {display:flex;align-items:center;gap:14px;padding:16px 0;border-top:1px solid var(--ep-border)}
.alert-list__icon {width:40px;height:40px;flex:0 0 40px;display:grid;place-items:center;border-radius:10px}
.alert-list__icon--danger {background:#fee2e2;color:#dc2626}
.alert-list__icon--warning {background:#fef3c7;color:#d97706}
.alert-list__icon--success {background:#dcfce7;color:#16a34a}
.alert-list__icon--info {background:#dbeafe;color:#2563eb}
.alert-list__icon--muted {background:#f3f4f6;color:#64748b}
.alert-list__content {display:flex;flex-direction:column;gap:5px;flex:1;min-width:0}
.alert-list__content strong {font-size:13px;color:var(--ep-text);overflow-wrap:anywhere}
.alert-list__content small {font-size:12px;color:var(--ep-text-secondary)}
.alert-list__status {white-space:nowrap}
.alert-list__status.status-badge--muted {background:#f3f4f6;color:#64748b}
@media(max-width:700px) {
  .alert-list__item {flex-wrap:wrap}
  .alert-list__content {flex-basis:calc(100% - 56px)}
  .alert-list__status {margin-left:54px}
}
</style>
