
<script setup>
import {computed, ref, watch} from 'vue';
import {useI18n} from 'vue-i18n';
import {useToast} from 'primevue/usetoast';
import {useConfirm} from 'primevue/useconfirm';
import useParkingManagementStore from '../../application/parking-management.store.js';
import {SpotStatus} from '../../domain/model/spot-status.js';
import {parkingManagementLabels} from '../parking-management-labels.js';
import SpotFormDialog from './spot-form-dialog.vue';

const {t, locale} = useI18n();
const toast = useToast();
const confirm = useConfirm();
const store = useParkingManagementStore();

const labels = computed(() => parkingManagementLabels(locale.value));
const dialogVisible = ref(false);
const editingSpot = ref(null);
const selectedSpotId = ref(null);
const busySpotId = ref(null);

const selectedSpot = computed(() =>
    store.spots.find(spot =>
        String(spot.id) === String(selectedSpotId.value)
    ) ?? null
);

const orderedSpots = computed(() =>
    [...store.spots].sort((a, b) =>
        a.level - b.level ||
        a.code.localeCompare(b.code, undefined, {numeric: true})
    )
);

const legend = computed(() => [
  {status: SpotStatus.AVAILABLE, label: labels.value.available},
  {status: SpotStatus.OCCUPIED, label: labels.value.occupiedStatus},
  {status: SpotStatus.RESERVED, label: labels.value.reserved},
  {status: SpotStatus.OUT_OF_SERVICE, label: labels.value.maintenance}
]);

watch(
    () => store.currentFacility?.id,
    () => {
      selectedSpotId.value = null;
      editingSpot.value = null;
      dialogVisible.value = false;
    }
);

function openRegister() {
  editingSpot.value = null;
  dialogVisible.value = true;
}

function openEdit(spot) {
  editingSpot.value = spot;
  dialogVisible.value = true;
}

function showSuccess(message) {
  toast.add({
    severity: 'success',
    summary: message,
    life: 3500
  });
}

function showError(message) {
  toast.add({
    severity: 'error',
    summary: message,
    life: 4000
  });
}

async function applyTransition(spot, transition) {
  if (busySpotId.value !== null) return;

  busySpotId.value = spot.id;

  try {
    const result = await store.changeSpotStatus(spot.id, transition);

    if (result.success) {
      showSuccess(t('parking-management.spots.updated'));
    } else {
      showError(
          result.reason === 'invalid-transition'
              ? labels.value.invalidTransition
              : t('parking-management.spots.errors.failed')
      );
    }
  } finally {
    busySpotId.value = null;
  }
}

function confirmDelete(spot) {
  confirm.require({
    header: labels.value.deleteSpot,
    message: `${labels.value.confirmDeleteSpot} (${spot.code})`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: labels.value.delete,
    rejectLabel: labels.value.cancel,
    acceptClass: 'p-button-danger',
    accept: async () => {
      if (busySpotId.value !== null) return;

      busySpotId.value = spot.id;

      try {
        const result = await store.deleteSpot(spot.id);

        if (result.success) {
          selectedSpotId.value = null;
          showSuccess(labels.value.spotDeleted);
          return;
        }

        const message = {
          'spot-in-use': labels.value.spotInUse,
          'linked-records': labels.value.linkedRecords
        }[result.reason] ?? labels.value.error;

        showError(message);
      } finally {
        busySpotId.value = null;
      }
    }
  });
}

function spotStatusLabel(spot) {
  return t(`parking-management.spots.status-values.${spot.status}`);
}
</script>

<template>
  <section class="panel spot-map" aria-labelledby="spot-map-title">
    <div class="spot-map__header">
      <h2 id="spot-map-title" class="panel-title">
        {{ labels.mapTitle }} — {{ store.currentFacility?.name }}
      </h2>

      <div class="spot-map__legend">
        <span
            v-for="item in legend"
            :key="item.status"
            class="spot-map__legend-item">

          <span
              class="spot-map__dot"
              :class="`spot-map__dot--${item.status}`">
          </span>

          {{ item.label }}
        </span>
      </div>
    </div>

    <div class="spot-map__toolbar">
      <span class="spot-map__count">
        {{ store.spots.length }} {{ labels.spaces.toLowerCase() }}
      </span>

      <pv-button
          :label="t('parking-management.spots.register')"
          icon="pi pi-plus"
          size="small"
          outlined
          @click="openRegister"/>
    </div>

    <p v-if="!store.spots.length" class="empty-state">
      {{ t('parking-management.spots.empty') }}
    </p>

    <div v-else class="spot-map__grid">
      <button
          v-for="spot in orderedSpots"
          :key="spot.id"
          type="button"
          class="spot-map__tile"
          :class="[
            `spot-map__tile--${spot.status}`,
            {'spot-map__tile--selected': selectedSpotId === spot.id}
          ]"
          :title="`${spot.code} · ${spotStatusLabel(spot)}`"
          :aria-label="`${spot.code}: ${spotStatusLabel(spot)}`"
          :aria-pressed="selectedSpotId === spot.id"
          @click="selectedSpotId = spot.id">

        {{ spot.code }}
      </button>
    </div>

    <div v-if="selectedSpot" class="spot-map__selection">
      <div class="spot-map__selection-info">
        <strong>{{ labels.selectedSpot }}: {{ selectedSpot.code }}</strong>

        <span>
          {{ spotStatusLabel(selectedSpot) }}
          ·
          {{ t('parking-management.fields.spot-level') }} {{ selectedSpot.level }}
          ·
          {{ t(`parking-management.spots.types.${selectedSpot.type}`) }}
        </span>
      </div>

      <div class="spot-map__actions">
        <pv-button
            v-if="selectedSpot.status === SpotStatus.AVAILABLE"
            icon="pi pi-car"
            :label="t('parking-management.spots.mark-occupied')"
            size="small"
            severity="secondary"
            outlined
            :disabled="busySpotId !== null"
            @click="applyTransition(selectedSpot, 'occupy')"/>

        <pv-button
            v-if="selectedSpot.status === SpotStatus.OCCUPIED ||
                  selectedSpot.status === SpotStatus.RESERVED"
            icon="pi pi-check"
            :label="t('parking-management.spots.mark-available')"
            size="small"
            severity="secondary"
            outlined
            :disabled="busySpotId !== null"
            @click="applyTransition(selectedSpot, 'free')"/>

        <pv-button
            v-if="selectedSpot.status === SpotStatus.AVAILABLE"
            icon="pi pi-ban"
            :label="t('parking-management.spots.mark-out-of-service')"
            size="small"
            severity="secondary"
            outlined
            :disabled="busySpotId !== null"
            @click="applyTransition(selectedSpot, 'markOutOfService')"/>

        <pv-button
            v-if="selectedSpot.status === SpotStatus.OUT_OF_SERVICE"
            icon="pi pi-refresh"
            :label="t('parking-management.spots.return-to-service')"
            size="small"
            severity="secondary"
            outlined
            :disabled="busySpotId !== null"
            @click="applyTransition(selectedSpot, 'returnToService')"/>

        <pv-button
            icon="pi pi-pencil"
            :aria-label="t('parking-management.spots.edit-tooltip')"
            severity="secondary"
            outlined
            size="small"
            :disabled="busySpotId !== null"
            @click="openEdit(selectedSpot)"/>

        <pv-button
            icon="pi pi-trash"
            :aria-label="labels.deleteSpot"
            severity="danger"
            outlined
            size="small"
            :disabled="busySpotId !== null"
            @click="confirmDelete(selectedSpot)"/>
      </div>
    </div>
  </section>

  <spot-form-dialog
      v-model:visible="dialogVisible"
      :spot="editingSpot"/>
</template>

<style scoped>
.spot-map {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.spot-map__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.spot-map__header h2 {
  margin: 0;
}

.spot-map__legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}

.spot-map__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ep-text-secondary);
  font-size: 12px;
  white-space: nowrap;
}

.spot-map__dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}

.spot-map__dot--AVAILABLE {
  background: #16a34a;
}

.spot-map__dot--OCCUPIED {
  background: #dc2626;
}

.spot-map__dot--RESERVED {
  background: #2563eb;
}

.spot-map__dot--OUT_OF_SERVICE {
  background: #f59e0b;
}

.spot-map__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.spot-map__count {
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.spot-map__grid {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  gap: 10px;
}

.spot-map__tile {
  min-width: 0;
  min-height: 52px;
  border: 1px solid;
  border-radius: 7px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

.spot-map__tile:hover {
  transform: translateY(-2px);
}

.spot-map__tile:focus-visible {
  outline: 3px solid var(--ep-primary);
  outline-offset: 3px;
}

.spot-map__tile--selected {
  box-shadow: 0 0 0 2px var(--ep-primary);
}

.spot-map__tile--AVAILABLE {
  background: #dcfce7;
  border-color: #16a34a;
  color: #15803d;
}

.spot-map__tile--OCCUPIED {
  background: #fee2e2;
  border-color: #dc2626;
  color: #dc2626;
}

.spot-map__tile--RESERVED {
  background: #dbeafe;
  border-color: #2563eb;
  color: #1d4ed8;
}

.spot-map__tile--OUT_OF_SERVICE {
  background: #fef3c7;
  border-color: #f59e0b;
  color: #d97706;
}

.spot-map__selection {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  padding-top: 14px;
  border-top: 1px solid var(--ep-border);
}

.spot-map__selection-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 13px;
}

.spot-map__selection-info span {
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.spot-map__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 1199px) {
  .spot-map__grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 575px) {
  .spot-map__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .spot-map__toolbar {
    align-items: flex-start;
  }
}
</style>
