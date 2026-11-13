
<script setup>
import {computed, ref, watch} from 'vue';
import {useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import {useToast} from 'primevue/usetoast';
import {useConfirm} from 'primevue/useconfirm';
import useProfilesStore from '../../../profiles/application/profiles.store.js';
import useIamStore from '../../../iam/application/iam.store.js';
import useParkingManagementStore from '../../application/parking-management.store.js';
import {FacilityStatus} from '../../domain/model/facility-status.js';
import {parkingManagementLabels} from '../parking-management-labels.js';
import FacilityFormDialog from '../components/facility-form-dialog.vue';
import SpotList from '../components/spot-list.vue';

const {locale} = useI18n();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const profilesStore = useProfilesStore();
const iamStore = useIamStore();
const store = useParkingManagementStore();

const labels = computed(() => parkingManagementLabels(locale.value));

const search = ref('');
const statusFilter = ref('ALL');
const districtFilter = ref('ALL');
const dialogVisible = ref(false);
const editingFacility = ref(null);
const deletingId = ref(null);
const profileLoading = ref(false);
const creatingZone = ref(false);
const selectedFacilityId = ref(null);

let pendingProfileRequest = null;

const sameId = (a, b) =>
    a != null && b != null && String(a) === String(b);

const operatorProfileId = computed(() => {
  const profile = profilesStore.currentProfile;

  if (!iamStore.isOperator || !profile || iamStore.currentUserId == null) {
    return null;
  }

  if (!sameId(profile.userAccountId, iamStore.currentUserId)) {
    return null;
  }

  return profile.id ?? null;
});

const profileErrorMessage = computed(() =>
    String(locale.value).startsWith('en')
        ? 'Could not load your operator profile. Please try again.'
        : 'No se pudo cargar tu perfil de administrador. Inténtalo de nuevo.'
);

const retryLabel = computed(() =>
    String(locale.value).startsWith('en') ? 'Retry' : 'Reintentar'
);

const profileLoadingMessage = computed(() =>
    String(locale.value).startsWith('en')
        ? 'Loading operator profile...'
        : 'Cargando perfil de administrador...'
);

async function ensureOperatorProfile() {
  if (operatorProfileId.value != null) return true;

  if (!iamStore.isOperator || iamStore.currentUserId == null) {
    return false;
  }

  if (!pendingProfileRequest) {
    profileLoading.value = true;

    pendingProfileRequest = profilesStore
        .fetchProfile(iamStore.currentUserId, true)
        .then(() => operatorProfileId.value != null)
        .catch(() => false)
        .finally(() => {
          profileLoading.value = false;
          pendingProfileRequest = null;
        });
  }

  return await pendingProfileRequest;
}

async function retryLoading() {
  if (operatorProfileId.value != null) {
    await store.fetchFacilities(operatorProfileId.value);
    return;
  }

  await ensureOperatorProfile();
}

function districtOf(facility) {
  const parts = String(facility.address ?? '')
      .split(',')
      .map(part => part.trim())
      .filter(Boolean);

  return parts.length > 1 ? parts[parts.length - 1] : '';
}

function statusOf(facility) {
  if (facility.status === FacilityStatus.MAINTENANCE) {
    return 'MAINTENANCE';
  }

  if (facility.status === FacilityStatus.INACTIVE) {
    return 'INACTIVE';
  }

  return facility.isFull ? 'FULL' : 'ACTIVE';
}

const statusOptions = computed(() => [
  {label: `${labels.value.state}: ${labels.value.all}`, value: 'ALL'},
  {label: labels.value.status.ACTIVE, value: 'ACTIVE'},
  {label: labels.value.status.FULL, value: 'FULL'},
  {label: labels.value.status.MAINTENANCE, value: 'MAINTENANCE'},
  {label: labels.value.status.INACTIVE, value: 'INACTIVE'}
]);

const districtOptions = computed(() => {
  const districts = [...new Set(
      store.facilities.map(districtOf).filter(Boolean)
  )].sort((a, b) => a.localeCompare(b, locale.value));

  return [
    {
      label: `${labels.value.district}: ${labels.value.all}`,
      value: 'ALL'
    },
    ...districts.map(district => ({
      label: district,
      value: district
    }))
  ];
});

const filteredFacilities = computed(() => {
  const term = search.value.trim().toLocaleLowerCase(locale.value);

  return store.facilities.filter(facility => {
    const district = districtOf(facility);

    const matchesSearch =
        !term ||
        facility.name.toLocaleLowerCase(locale.value).includes(term) ||
        facility.address.toLocaleLowerCase(locale.value).includes(term) ||
        district.toLocaleLowerCase(locale.value).includes(term);

    const matchesStatus =
        statusFilter.value === 'ALL' ||
        statusOf(facility) === statusFilter.value;

    const matchesDistrict =
        districtFilter.value === 'ALL' ||
        district === districtFilter.value;

    return matchesSearch && matchesStatus && matchesDistrict;
  });
});

const selectedFacility = computed(() =>
    filteredFacilities.value.find(
        facility => sameId(facility.id, selectedFacilityId.value)
    ) ?? null
);

const mapLoading = computed(() =>
    selectedFacility.value !== null &&
    (
        !sameId(store.currentFacility?.id, selectedFacility.value.id) ||
        !store.spotsLoaded
    )
);

watch(
    [() => iamStore.currentUserId, () => iamStore.isOperator],
    ([userId, isOperator]) => {
      if (userId != null && isOperator) {
        ensureOperatorProfile();
      }
    },
    {immediate: true}
);

watch(
    operatorProfileId,
    id => {
      if (id == null) {
        selectedFacilityId.value = null;
        store.clear();
        return;
      }

      store.fetchFacilities(id);
    },
    {immediate: true}
);

watch(
    [filteredFacilities, () => store.facilitiesLoaded],
    ([facilities, loaded]) => {
      if (!loaded) return;

      if (!facilities.length) {
        selectedFacilityId.value = null;
        return;
      }

      const selected = facilities.find(
          facility => sameId(facility.id, selectedFacilityId.value)
      );

      if (selected) {
        if (!sameId(store.currentFacility?.id, selected.id)) {
          store.selectFacility(selected.id, true);
        }
        return;
      }

      const preferred = facilities.find(
          facility => sameId(facility.id, store.currentFacility?.id)
      ) ?? facilities[0];

      selectedFacilityId.value = preferred.id;

      if (!sameId(store.currentFacility?.id, preferred.id)) {
        store.selectFacility(preferred.id, true);
      }
    },
    {immediate: true}
);

watch(
    () => store.currentFacility?.id,
    id => {
      if (id == null) return;

      const visible = filteredFacilities.value.some(
          facility => sameId(facility.id, id)
      );

      if (visible) {
        selectedFacilityId.value = id;
      }
    }
);

async function selectFacility(facility) {
  selectedFacilityId.value = facility.id;

  await store.selectFacility(facility.id, true);
}

async function openCreate() {
  if (creatingZone.value) return;

  creatingZone.value = true;

  try {
    const available = await ensureOperatorProfile();

    if (!available) {
      toast.add({
        severity: 'error',
        summary: profileErrorMessage.value,
        life: 4500
      });
      return;
    }

    editingFacility.value = null;
    dialogVisible.value = true;
  } finally {
    creatingZone.value = false;
  }
}

function openEdit(facility) {
  editingFacility.value = facility;
  dialogVisible.value = true;
}

function openDetails(facility) {
  router.push({
    name: 'parking-management-facility-detail',
    params: {facilityId: facility.id}
  });
}

function statusClass(facility) {
  return {
    ACTIVE: 'success',
    FULL: 'danger',
    MAINTENANCE: 'warning',
    INACTIVE: 'info'
  }[statusOf(facility)] ?? 'info';
}

function confirmDelete(facility) {
  confirm.require({
    header: labels.value.deleteZone,
    message: `${labels.value.confirmDeleteZone} (${facility.name})`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: labels.value.delete,
    rejectLabel: labels.value.cancel,
    acceptClass: 'p-button-danger',
    accept: async () => {
      if (deletingId.value !== null) return;

      deletingId.value = facility.id;

      try {
        const result = await store.deleteFacility(facility.id);

        toast.add({
          severity: result.success ? 'success' : 'error',
          summary: result.success
              ? labels.value.zoneDeleted
              : result.reason === 'zone-not-empty'
                  ? labels.value.zoneNotEmpty
                  : labels.value.error,
          life: 4000
        });
      } finally {
        deletingId.value = null;
      }
    }
  });
}
</script>

<template>
  <section class="page parking-zones">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ labels.title }}</h1>
        <p class="page-subtitle">{{ labels.subtitle }}</p>
      </div>

      <pv-button
          :label="labels.newZone"
          icon="pi pi-plus"
          :loading="creatingZone"
          @click="openCreate"/>
    </div>

    <div class="parking-zones__filters">
      <div class="parking-zones__search">
        <i class="pi pi-search" aria-hidden="true"></i>

        <pv-input-text
            v-model="search"
            :placeholder="labels.search"
            :aria-label="labels.search"/>
      </div>

      <pv-select
          v-model="statusFilter"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          :aria-label="labels.state"
          class="parking-zones__select"/>

      <pv-select
          v-model="districtFilter"
          :options="districtOptions"
          option-label="label"
          option-value="value"
          :aria-label="labels.district"
          class="parking-zones__select"/>
    </div>

    <section class="panel parking-zones__table-panel">
      <div
          v-if="operatorProfileId == null"
          class="parking-zones__profile-state">

        <p
            class="empty-state"
            :aria-busy="profileLoading">
          {{ profileLoading ? profileLoadingMessage : profileErrorMessage }}
        </p>

        <pv-button
            v-if="!profileLoading"
            :label="retryLabel"
            icon="pi pi-refresh"
            size="small"
            outlined
            @click="retryLoading"/>
      </div>

      <p
          v-else-if="!store.facilitiesLoaded"
          class="empty-state"
          aria-busy="true">
        {{ labels.title }}...
      </p>

      <p
          v-else-if="store.errors.length && !store.facilities.length"
          class="empty-state">
        {{ labels.error }}
      </p>

      <p
          v-else-if="!store.facilities.length"
          class="empty-state">
        {{ labels.selectZone }}
      </p>

      <p
          v-else-if="!filteredFacilities.length"
          class="empty-state">
        {{ labels.noResults }}
      </p>

      <div v-else class="parking-zones__table-wrap">
        <table class="parking-zones__table">
          <thead>
          <tr>
            <th scope="col">{{ labels.zone }}</th>
            <th scope="col">{{ labels.address }}</th>
            <th scope="col">{{ labels.spaces }}</th>
            <th scope="col">{{ labels.occupied }}</th>
            <th scope="col">{{ labels.state }}</th>
            <th scope="col">{{ labels.actions }}</th>
          </tr>
          </thead>

          <tbody>
          <tr
              v-for="facility in filteredFacilities"
              :key="facility.id"
              :class="{
                  'parking-zones__row--selected':
                    sameId(selectedFacilityId, facility.id)
                }">

            <td class="parking-zones__name">
              <button
                  type="button"
                  class="parking-zones__zone-link"
                  :aria-pressed="sameId(selectedFacilityId, facility.id)"
                  @click="selectFacility(facility)">
                {{ facility.name }}
              </button>
            </td>

            <td>{{ facility.address }}</td>

            <td>{{ facility.totalSpots }}</td>

            <td>{{ facility.occupiedSpots }}</td>

            <td>
                <span
                    class="status-badge"
                    :class="`status-badge--${statusClass(facility)}`">
                  {{ labels.status[statusOf(facility)] }}
                </span>
            </td>

            <td class="parking-zones__actions">
              <pv-button
                  icon="pi pi-pencil"
                  size="small"
                  text
                  rounded
                  severity="secondary"
                  :aria-label="`${labels.editZone}: ${facility.name}`"
                  v-tooltip.top="labels.editZone"
                  @click="openEdit(facility)"/>

              <pv-button
                  icon="pi pi-trash"
                  size="small"
                  text
                  rounded
                  severity="secondary"
                  :disabled="deletingId !== null"
                  :aria-label="`${labels.deleteZone}: ${facility.name}`"
                  v-tooltip.top="labels.deleteZone"
                  @click="confirmDelete(facility)"/>

              <pv-button
                  icon="pi pi-arrow-right"
                  size="small"
                  text
                  rounded
                  severity="secondary"
                  :aria-label="`${labels.showDetails}: ${facility.name}`"
                  v-tooltip.top="labels.showDetails"
                  @click="openDetails(facility)"/>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div
        v-if="store.facilitiesLoaded && selectedFacility && mapLoading"
        class="panel">
      <p class="empty-state">{{ labels.loadingMap }}</p>
    </div>

    <spot-list
        v-else-if="store.facilitiesLoaded && selectedFacility"
        :key="String(selectedFacility.id)"/>

    <div
        v-else-if="store.facilitiesLoaded && store.facilities.length"
        class="panel">
      <p class="empty-state">{{ labels.selectZone }}</p>
    </div>
  </section>

  <facility-form-dialog
      v-model:visible="dialogVisible"
      :operator-profile-id="operatorProfileId"
      :facility="editingFacility"/>
</template>

<style scoped>
.parking-zones__profile-state {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 12px;
  padding: 12px 0 18px;
}

.parking-zones__filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.parking-zones__search {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 10px;
  padding: 0 14px;
  min-width: 0;
  min-height: 42px;
  background: var(--ep-surface);
  border: 1px solid var(--ep-border);
  border-radius: 8px;
}

.parking-zones__search .pi {
  color: var(--ep-text-secondary);
  font-size: 13px;
}

.parking-zones__search :deep(.p-inputtext) {
  width: 100%;
  border: 0;
  box-shadow: none;
  padding-left: 0;
  background: transparent;
}

.parking-zones__select {
  flex: 0 0 170px;
}

.parking-zones__table-panel {
  margin-bottom: 20px;
  padding: 0;
  overflow: hidden;
}

.parking-zones__table-wrap {
  width: 100%;
  overflow-x: auto;
}

.parking-zones__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.parking-zones__table th {
  padding: 15px 22px;
  background: var(--ep-page);
  color: var(--ep-text-secondary);
  font-size: 11px;
  font-weight: 700;
  text-align: left;
  text-transform: uppercase;
  white-space: nowrap;
}

.parking-zones__table td {
  padding: 13px 22px;
  border-top: 1px solid var(--ep-border);
  color: var(--ep-text);
  vertical-align: middle;
}

.parking-zones__row--selected {
  background: var(--ep-primary-soft);
}

.parking-zones__name {
  min-width: 180px;
  font-weight: 700;
}

.parking-zones__zone-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
}

.parking-zones__zone-link:hover,
.parking-zones__zone-link:focus-visible {
  color: var(--ep-primary);
}

.parking-zones__actions {
  display: flex;
  gap: 4px;
  justify-content: flex-start;
  white-space: nowrap;
}

@media (max-width: 850px) {
  .parking-zones__filters {
    flex-wrap: wrap;
  }

  .parking-zones__search {
    flex-basis: 100%;
  }

  .parking-zones__select {
    flex: 1 1 160px;
  }

  .parking-zones__table th,
  .parking-zones__table td {
    padding: 12px 14px;
  }
}
</style>
