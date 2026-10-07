<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";
import useParkingManagementStore from "../../application/parking-management.store.js";
import SpotFormDialog from "./spot-form-dialog.vue";

const STATUSES = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'OUT_OF_SERVICE'];

const {t} = useI18n();
const toast = useToast();
const store = useParkingManagementStore();

const dialogVisible = ref(false);
const selectedSpot = ref(null);
const busySpotId = ref(null);
const view = ref('map');
const menu = ref();
const menuSpot = ref(null);

const viewOptions = computed(() => [
  {label: t('parking-management.spots.views.map'), value: 'map'},
  {label: t('parking-management.spots.views.list'), value: 'list'}
]);

/**
 * Spots grouped by level, sorted by code inside each level, for the map view.
 */
const levels = computed(() => {
  const byLevel = new Map();
  for (const spot of store.spots) {
    if (!byLevel.has(spot.level)) byLevel.set(spot.level, []);
    byLevel.get(spot.level).push(spot);
  }
  return [...byLevel.entries()]
      .sort(([a], [b]) => a - b)
      .map(([level, spots]) => ({
        level,
        spots: [...spots].sort((a, b) => String(a.code).localeCompare(String(b.code), undefined, {numeric: true}))
      }));
});

const menuItems = computed(() => {
  const spot = menuSpot.value;
  if (!spot) return [];
  const items = [];
  if (spot.status === 'AVAILABLE')
    items.push({label: t('parking-management.spots.mark-occupied'), icon: 'pi pi-car', command: () => applyTransition(spot, 'occupy')});
  if (spot.status === 'OCCUPIED' || spot.status === 'RESERVED')
    items.push({label: t('parking-management.spots.mark-available'), icon: 'pi pi-check', command: () => applyTransition(spot, 'free')});
  items.push(spot.status !== 'OUT_OF_SERVICE'
      ? {label: t('parking-management.spots.mark-out-of-service'), icon: 'pi pi-ban', command: () => applyTransition(spot, 'markOutOfService')}
      : {label: t('parking-management.spots.return-to-service'), icon: 'pi pi-refresh', command: () => applyTransition(spot, 'returnToService')});
  items.push({separator: true});
  items.push({label: t('parking-management.spots.edit-tooltip'), icon: 'pi pi-pencil', command: () => openEdit(spot)});
  return items;
});

function openRegister() {
  selectedSpot.value = null;
  dialogVisible.value = true;
}

function openEdit(spot) {
  selectedSpot.value = spot;
  dialogVisible.value = true;
}

function openMenu(event, spot) {
  menuSpot.value = spot;
  menu.value.toggle(event);
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

function countByStatus(status) {
  return store.spots.filter(spot => spot.status === status).length;
}
</script>

<template>
  <section class="panel" aria-labelledby="spots-title">
    <div class="panel-header">
      <div>
        <h2 id="spots-title" class="panel-title">{{ t('parking-management.spots.title') }}</h2>
        <p class="panel-description">{{ t('parking-management.spots.description') }}</p>
      </div>
      <div class="panel-actions">
        <pv-select-button v-if="store.spots.length" v-model="view" :options="viewOptions" option-label="label"
                          option-value="value" :allow-empty="false" size="small"
                          :aria-label="t('parking-management.spots.views.label')"/>
        <pv-button :label="t('parking-management.spots.register')" icon="pi pi-plus" size="small" @click="openRegister"/>
      </div>
    </div>

    <div v-if="!store.spots.length" class="empty">
      <span class="icon-chip icon-chip--lg icon-chip--muted" aria-hidden="true"><i class="pi pi-th-large"></i></span>
      <p class="empty__text">{{ t('parking-management.spots.empty') }}</p>
      <pv-button class="empty__action" :label="t('parking-management.spots.register')" icon="pi pi-plus" @click="openRegister"/>
    </div>

    <template v-else>
      <ul class="spot-legend" :aria-label="t('parking-management.spots.status')">
        <li v-for="status in STATUSES" :key="status" class="spot-legend__item">
          <span class="status-dot" :class="`status-dot--${statusBadgeModifier(status)}`" aria-hidden="true"></span>
          {{ t(`parking-management.spots.status-values.${status}`) }}
          <strong>{{ countByStatus(status) }}</strong>
        </li>
      </ul>

      <div v-if="view === 'map'" class="spot-map">
        <section v-for="group in levels" :key="group.level" class="spot-map__level">
          <h3 class="spot-map__title">{{ t('parking-management.spots.level', { level: group.level }) }}</h3>
          <div class="spot-map__grid">
            <button v-for="spot in group.spots" :key="spot.id" type="button" class="spot-tile"
                    :class="`spot-tile--${statusBadgeModifier(spot.status)}`" :disabled="busySpotId === spot.id"
                    aria-haspopup="true" aria-controls="spot-menu"
                    :aria-label="t('parking-management.spots.tile', { code: spot.code, status: t(`parking-management.spots.status-values.${spot.status}`) })"
                    @click="openMenu($event, spot)">
              <span class="spot-tile__code">{{ spot.code }}</span>
              <span class="spot-tile__type">{{ t(`parking-management.spots.types.${spot.type}`) }}</span>
            </button>
          </div>
        </section>
      </div>

      <div v-else class="table-scroll">
        <table class="data-table spot-table">
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
            <td class="spot-table__code">{{ spot.code }}</td>
            <td>{{ spot.level }}</td>
            <td>{{ t(`parking-management.spots.types.${spot.type}`) }}</td>
            <td>
              <span class="status-badge" :class="`status-badge--${statusBadgeModifier(spot.status)}`">
                {{ t(`parking-management.spots.status-values.${spot.status}`) }}
              </span>
            </td>
            <td class="data-table__actions">
              <pv-button v-if="spot.status === 'AVAILABLE'" icon="pi pi-car" text rounded severity="secondary" size="small" :disabled="busySpotId === spot.id"
                         v-tooltip.top="t('parking-management.spots.mark-occupied')" :aria-label="t('parking-management.spots.mark-occupied')"
                         @click="applyTransition(spot, 'occupy')"/>
              <pv-button v-if="spot.status === 'OCCUPIED' || spot.status === 'RESERVED'" icon="pi pi-check" text rounded severity="secondary" size="small" :disabled="busySpotId === spot.id"
                         v-tooltip.top="t('parking-management.spots.mark-available')" :aria-label="t('parking-management.spots.mark-available')"
                         @click="applyTransition(spot, 'free')"/>
              <pv-button v-if="spot.status !== 'OUT_OF_SERVICE'" icon="pi pi-ban" text rounded severity="danger" size="small" :disabled="busySpotId === spot.id"
                         v-tooltip.top="t('parking-management.spots.mark-out-of-service')" :aria-label="t('parking-management.spots.mark-out-of-service')"
                         @click="applyTransition(spot, 'markOutOfService')"/>
              <pv-button v-else icon="pi pi-refresh" text rounded severity="secondary" size="small" :disabled="busySpotId === spot.id"
                         v-tooltip.top="t('parking-management.spots.return-to-service')" :aria-label="t('parking-management.spots.return-to-service')"
                         @click="applyTransition(spot, 'returnToService')"/>
              <pv-button icon="pi pi-pencil" text rounded severity="secondary" size="small" :disabled="busySpotId === spot.id"
                         :aria-label="t('parking-management.spots.edit', { code: spot.code })"
                         v-tooltip.top="t('parking-management.spots.edit-tooltip')" @click="openEdit(spot)"/>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </template>

    <pv-menu id="spot-menu" ref="menu" :model="menuItems" popup/>
  </section>
  <spot-form-dialog v-model:visible="dialogVisible" :spot="selectedSpot"/>
</template>

<style scoped>
.spot-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
  margin: 0 0 20px;
  padding: 12px 16px;
  border-radius: 10px;
  background: var(--ep-page);
  list-style: none;
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.spot-legend__item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.spot-legend__item strong {
  color: var(--ep-text);
  font-weight: 700;
}

.spot-map {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.spot-map__title {
  margin: 0 0 10px;
  color: var(--ep-text-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.spot-map__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
  gap: 10px;
}

.spot-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  min-height: 64px;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 10px;
  font: inherit;
  cursor: pointer;
}

.spot-tile:disabled {
  opacity: 0.6;
  cursor: progress;
}

.spot-tile__code {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.spot-tile__type {
  font-size: 11px;
  font-weight: 500;
}

.spot-tile--success {
  border-color: #86efac;
  background: var(--ep-success-bg);
  color: var(--ep-success-text);
}

.spot-tile--info {
  border-color: #93c5fd;
  background: var(--ep-primary-soft);
  color: var(--ep-primary-hover);
}

.spot-tile--warning {
  border-color: #fcd34d;
  background: var(--ep-warning-bg);
  color: var(--ep-warning-text);
}

.spot-tile--danger {
  border-color: #fca5a5;
  background: var(--ep-danger-bg);
  color: var(--ep-danger-text);
}

.spot-tile:hover:not(:disabled),
.spot-tile:focus-visible {
  border-color: currentColor;
}

.spot-table__code {
  font-weight: 700;
  letter-spacing: 0.04em;
}
</style>
