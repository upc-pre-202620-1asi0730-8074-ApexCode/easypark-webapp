<script setup>
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import {useConfirm} from "primevue/useconfirm";
import {useToast} from "primevue/usetoast";
import useProfilesStore from "../../application/profiles.store.js";
import VehicleFormDialog from "./vehicle-form-dialog.vue";

const { t } = useI18n();
const confirm = useConfirm();
const toast = useToast();
const store = useProfilesStore();

const dialogVisible = ref(false);
const selectedVehicle = ref(null);
const busyVehicleId = ref(null);

function openRegister() {
  selectedVehicle.value = null;
  dialogVisible.value = true;
}

function openEdit(vehicle) {
  selectedVehicle.value = vehicle;
  dialogVisible.value = true;
}

async function markAsDefault(vehicle) {
  busyVehicleId.value = vehicle.id;
  const result = await store.setDefaultVehicle(vehicle.id);
  busyVehicleId.value = null;
  toast.add(result.success
      ? { severity: 'success', summary: t('profiles.vehicles.default-updated', { plate: vehicle.plateNumber.value }), life: 4000 }
      : { severity: 'error', summary: t('profiles.vehicles.errors.failed'), life: 4000 });
}

function confirmRemove(vehicle) {
  const plate = vehicle.plateNumber.value;
  confirm.require({
    header: t('profiles.vehicles.remove-header'),
    message: t('profiles.vehicles.remove-message', { plate }),
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: t('common.cancel'), severity: 'secondary', outlined: true },
    acceptProps: { label: t('profiles.vehicles.remove'), severity: 'danger' },
    accept: async () => {
      busyVehicleId.value = vehicle.id;
      const result = await store.removeVehicle(vehicle.id);
      busyVehicleId.value = null;
      toast.add(result.success
          ? { severity: 'success', summary: t('profiles.vehicles.removed', { plate }), life: 4000 }
          : { severity: 'error', summary: t('profiles.vehicles.errors.failed'), life: 4000 });
    }
  });
}
</script>

<template>
  <section class="panel" aria-labelledby="vehicles-title">
    <div class="panel-header">
      <h2 id="vehicles-title" class="panel-title">{{ t('profiles.vehicles.title') }}</h2>
      <pv-button :label="t('profiles.vehicles.register')" icon="pi pi-plus" size="small" @click="openRegister"/>
    </div>
    <p v-if="!store.vehicles.length" class="empty-state">{{ t('profiles.vehicles.empty') }}</p>
    <table v-else class="vehicle-table">
      <thead>
        <tr>
          <th scope="col">{{ t('profiles.fields.plate-number') }}</th>
          <th scope="col">{{ t('profiles.fields.vehicle-type') }}</th>
          <th scope="col">{{ t('profiles.fields.color') }}</th>
          <th scope="col">{{ t('profiles.vehicles.status') }}</th>
          <th scope="col"><span class="sr-only">{{ t('profiles.vehicles.actions') }}</span></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="vehicle in store.vehicles" :key="vehicle.id">
          <td :data-label="t('profiles.fields.plate-number')" class="vehicle-table__plate">{{ vehicle.plateNumber.value }}</td>
          <td :data-label="t('profiles.fields.vehicle-type')">{{ vehicle.type ? t(`profiles.vehicle-types.${vehicle.type}`) : '—' }}</td>
          <td :data-label="t('profiles.fields.color')">{{ vehicle.color || '—' }}</td>
          <td :data-label="t('profiles.vehicles.status')">
            <span v-if="vehicle.isDefault" class="status-badge status-badge--info">{{ t('profiles.vehicles.default') }}</span>
            <pv-button v-else :label="t('profiles.vehicles.make-default')" text size="small"
                       :loading="busyVehicleId === vehicle.id" class="vehicle-table__default" @click="markAsDefault(vehicle)"/>
          </td>
          <td class="vehicle-table__actions">
            <pv-button icon="pi pi-pencil" text rounded severity="secondary" :disabled="busyVehicleId === vehicle.id"
                       :aria-label="t('profiles.vehicles.edit', { plate: vehicle.plateNumber.value })"
                       v-tooltip.top="t('profiles.vehicles.edit-tooltip')" @click="openEdit(vehicle)"/>
            <pv-button icon="pi pi-trash" text rounded severity="danger" :disabled="busyVehicleId === vehicle.id"
                       :aria-label="t('profiles.vehicles.remove-aria', { plate: vehicle.plateNumber.value })"
                       v-tooltip.top="t('profiles.vehicles.remove')" @click="confirmRemove(vehicle)"/>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
  <vehicle-form-dialog v-model:visible="dialogVisible" :vehicle="selectedVehicle"/>
</template>

<style scoped>
.vehicle-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.vehicle-table th {
  padding: 10px 12px;
  background: var(--ep-page);
  color: var(--ep-text-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-align: left;
  text-transform: uppercase;
}

.vehicle-table td {
  padding: 10px 12px;
  border-top: 1px solid var(--ep-border);
  color: var(--ep-text);
  vertical-align: middle;
}

.vehicle-table__plate {
  font-weight: 700;
  letter-spacing: 0.04em;
}

.vehicle-table__default {
  padding-left: 0;
  padding-right: 0;
}

.vehicle-table__actions {
  text-align: right;
  white-space: nowrap;
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
  .vehicle-table thead {
    display: none;
  }

  .vehicle-table,
  .vehicle-table tbody,
  .vehicle-table tr,
  .vehicle-table td {
    display: block;
    width: 100%;
  }

  .vehicle-table tr {
    margin-bottom: 12px;
    padding: 8px 12px;
    border: 1px solid var(--ep-border);
    border-radius: 10px;
  }

  .vehicle-table td {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 0;
    border-top: 0;
  }

  .vehicle-table td[data-label]::before {
    content: attr(data-label);
    color: var(--ep-text-secondary);
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .vehicle-table__actions {
    justify-content: flex-end;
  }
}
</style>
