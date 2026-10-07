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

function vehicleIcon(vehicle) {
  return vehicle.type === 'VAN' ? 'pi pi-truck' : 'pi pi-car';
}

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
      <div>
        <h2 id="vehicles-title" class="panel-title">{{ t('profiles.vehicles.title') }}</h2>
        <p class="panel-description">{{ t('profiles.vehicles.description') }}</p>
      </div>
      <pv-button :label="t('profiles.vehicles.register')" icon="pi pi-plus" size="small" @click="openRegister"/>
    </div>

    <div v-if="!store.vehicles.length" class="empty">
      <span class="icon-chip icon-chip--lg icon-chip--muted" aria-hidden="true"><i class="pi pi-car"></i></span>
      <p class="empty__text">{{ t('profiles.vehicles.empty') }}</p>
    </div>

    <ul v-else class="vehicle-grid">
      <li v-for="vehicle in store.vehicles" :key="vehicle.id" class="vehicle-card"
          :class="{ 'vehicle-card--default': vehicle.isDefault }">
        <div class="vehicle-card__head">
          <span class="icon-chip" :class="vehicle.isDefault ? 'icon-chip--info' : 'icon-chip--muted'" aria-hidden="true">
            <i :class="vehicleIcon(vehicle)"></i>
          </span>
          <div class="vehicle-card__identity">
            <span class="plate">{{ vehicle.plateNumber.value }}</span>
            <span class="vehicle-card__meta">
              {{ vehicle.type ? t(`profiles.vehicle-types.${vehicle.type}`) : '—' }}
              <template v-if="vehicle.color"> · {{ vehicle.color }}</template>
            </span>
          </div>
          <div class="vehicle-card__actions">
            <pv-button icon="pi pi-pencil" text rounded severity="secondary" size="small" :disabled="busyVehicleId === vehicle.id"
                       :aria-label="t('profiles.vehicles.edit', { plate: vehicle.plateNumber.value })"
                       v-tooltip.top="t('profiles.vehicles.edit-tooltip')" @click="openEdit(vehicle)"/>
            <pv-button icon="pi pi-trash" text rounded severity="danger" size="small" :disabled="busyVehicleId === vehicle.id"
                       :aria-label="t('profiles.vehicles.remove-aria', { plate: vehicle.plateNumber.value })"
                       v-tooltip.top="t('profiles.vehicles.remove')" @click="confirmRemove(vehicle)"/>
          </div>
        </div>
        <div class="vehicle-card__foot">
          <span v-if="vehicle.isDefault" class="status-badge status-badge--info">
            <i class="pi pi-star-fill" aria-hidden="true"></i>{{ t('profiles.vehicles.default') }}
          </span>
          <pv-button v-else :label="t('profiles.vehicles.make-default')" text size="small"
                     :loading="busyVehicleId === vehicle.id" class="vehicle-card__default" @click="markAsDefault(vehicle)"/>
        </div>
      </li>
    </ul>
  </section>
  <vehicle-form-dialog v-model:visible="dialogVisible" :vehicle="selectedVehicle"/>
</template>

<style scoped>
.vehicle-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.vehicle-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--ep-border);
  border-radius: 12px;
  background: var(--ep-surface);
}

.vehicle-card--default {
  border-color: #bfdbfe;
  background: var(--ep-primary-tint);
}

.vehicle-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.vehicle-card__identity {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  min-width: 0;
}

.vehicle-card__meta {
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.vehicle-card__actions {
  display: flex;
  flex-shrink: 0;
}

.vehicle-card__foot {
  display: flex;
  align-items: center;
  min-height: 28px;
}

.vehicle-card__foot .status-badge i {
  font-size: 10px;
}

.vehicle-card__default {
  padding-left: 0;
  padding-right: 0;
}
</style>
