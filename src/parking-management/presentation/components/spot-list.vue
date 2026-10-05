<script setup>
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";
import useParkingManagementStore from "../../application/parking-management.store.js";
import SpotFormDialog from "./spot-form-dialog.vue";

const {t} = useI18n();
const toast = useToast();
const store = useParkingManagementStore();

const dialogVisible = ref(false);
const selectedSpot = ref(null);
const busySpotId = ref(null);

function openRegister() {
  selectedSpot.value = null;
  dialogVisible.value = true;
}

function openEdit(spot) {
  selectedSpot.value = spot;
  dialogVisible.value = true;
}

async function applyTransition(spot, transition) {
  busySpotId.value = spot.id;
  const result = await store.changeSpotStatus(spot.id, transition);
  busySpotId.value = null;
  toast.add(result.success
      ? {severity: 'success', summary: t('parking-management.spots.updated'), life: 4000}
      : {severity: 'error', summary: t('parking-management.spots.errors.failed'), life: 4000});
}

function statusBadgeModifier(status) {
  return {AVAILABLE: 'success', OCCUPIED: 'info', RESERVED: 'warning', OUT_OF_SERVICE: 'danger'}[status] ?? 'info';
}
</script>

<template>
  <section class="panel" aria-labelledby="spots-title">
    <div class="panel-header">
      <h2 id="spots-title" class="panel-title">{{ t('parking-management.spots.title') }}</h2>
      <pv-button :label="t('parking-management.spots.register')" icon="pi pi-plus" size="small" @click="openRegister"/>
    </div>
    <p v-if="!store.spots.length" class="empty-state">{{ t('parking-management.spots.empty') }}</p>
    <table v-else class="spot-table">
      <thead>
      <tr>
        <th scope="col">{{ t('parking-management.fields.spot-code') }}</th>
        <th scope="col">{{ t('parking-management.fields.spot-level') }}</th>
        <th scope="col">{{ t('parking-management.fields.spot-type') }}</th>
        <th scope="col">{{ t('parking-management.spots.status') }}</th>
        <th scope="col"><span class="sr-only">{{ t('parking-management.spots.actions') }}</span></th>
      </tr>
      </thead>
      <tbody>
      <tr v-for="spot in store.spots" :key="spot.id">
        <td :data-label="t('parking-management.fields.spot-code')" class="spot-table__code">{{ spot.code }}</td>
        <td :data-label="t('parking-management.fields.spot-level')">{{ spot.level }}</td>
        <td :data-label="t('parking-management.fields.spot-type')">{{ t(`parking-management.spots.types.${spot.type}`) }}</td>
        <td :data-label="t('parking-management.spots.status')">
            <span class="status-badge" :class="`status-badge--${statusBadgeModifier(spot.status)}`">
              {{ t(`parking-management.spots.status-values.${spot.status}`) }}
            </span>
        </td>
        <td class="spot-table__actions">
          <pv-button v-if="spot.status === 'AVAILABLE'" icon="pi pi-car" text rounded severity="secondary" :disabled="busySpotId === spot.id"
                     v-tooltip.top="t('parking-management.spots.mark-occupied')" :aria-label="t('parking-management.spots.mark-occupied')"
                     @click="applyTransition(spot, 'occupy')"/>
          <pv-button v-if="spot.status === 'OCCUPIED' || spot.status === 'RESERVED'" icon="pi pi-check" text rounded severity="secondary" :disabled="busySpotId === spot.id"
                     v-tooltip.top="t('parking-management.spots.mark-available')" :aria-label="t('parking-management.spots.mark-available')"
                     @click="applyTransition(spot, 'free')"/>
          <pv-button v-if="spot.status !== 'OUT_OF_SERVICE'" icon="pi pi-ban" text rounded severity="danger" :disabled="busySpotId === spot.id"
                     v-tooltip.top="t('parking-management.spots.mark-out-of-service')" :aria-label="t('parking-management.spots.mark-out-of-service')"
                     @click="applyTransition(spot, 'markOutOfService')"/>
          <pv-button v-else icon="pi pi-refresh" text rounded severity="secondary" :disabled="busySpotId === spot.id"
                     v-tooltip.top="t('parking-management.spots.return-to-service')" :aria-label="t('parking-management.spots.return-to-service')"
                     @click="applyTransition(spot, 'returnToService')"/>
          <pv-button icon="pi pi-pencil" text rounded severity="secondary" :disabled="busySpotId === spot.id"
                     :aria-label="t('parking-management.spots.edit', { code: spot.code })"
                     v-tooltip.top="t('parking-management.spots.edit-tooltip')" @click="openEdit(spot)"/>
        </td>
      </tr>
      </tbody>
    </table>
  </section>
  <spot-form-dialog v-model:visible="dialogVisible" :spot="selectedSpot"/>
</template>

<style scoped>
.spot-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.spot-table th {
  padding: 10px 12px;
  background: var(--ep-page);
  color: var(--ep-text-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-align: left;
  text-transform: uppercase;
}

.spot-table td {
  padding: 10px 12px;
  border-top: 1px solid var(--ep-border);
  color: var(--ep-text);
  vertical-align: middle;
}

.spot-table__code {
  font-weight: 700;
  letter-spacing: 0.04em;
}

.spot-table__actions {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

@media (max-width: 767px) {
  .spot-table thead {
    display: none;
  }

  .spot-table,
  .spot-table tbody,
  .spot-table tr,
  .spot-table td {
    display: block;
    width: 100%;
  }

  .spot-table tr {
    margin-bottom: 12px;
    padding: 8px 12px;
    border: 1px solid var(--ep-border);
    border-radius: 10px;
  }

  .spot-table td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    border-top: 0;
  }

  .spot-table td[data-label]::before {
    content: attr(data-label);
    color: var(--ep-text-secondary);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .spot-table__actions {
    justify-content: flex-end;
  }
}
</style>
