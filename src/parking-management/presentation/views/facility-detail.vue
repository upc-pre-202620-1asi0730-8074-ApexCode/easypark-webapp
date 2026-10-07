
<script setup>
import {computed, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import {useI18n} from 'vue-i18n';
import useProfilesStore from '../../../profiles/application/profiles.store.js';
import useParkingManagementStore from '../../application/parking-management.store.js';
import {parkingManagementLabels} from '../parking-management-labels.js';
import FacilityFormDialog from '../components/facility-form-dialog.vue';
import SpotList from '../components/spot-list.vue';

const {t, locale} = useI18n();
const route = useRoute();
const router = useRouter();
const profilesStore = useProfilesStore();
const store = useParkingManagementStore();

const labels = computed(() => parkingManagementLabels(locale.value));
const dialogVisible = ref(false);

const facilityId = computed(() => Number(route.params.facilityId));

const operatorProfileId = computed(() =>
    profilesStore.currentProfile?.id ?? null
);

const facility = computed(() =>
    String(store.currentFacility?.id) === String(facilityId.value)
        ? store.currentFacility
        : null
);

watch(
    [operatorProfileId, facilityId],
    async ([id, requestedFacilityId], _, onCleanup) => {
      let cancelled = false;

      onCleanup(() => {
        cancelled = true;
      });

      if (id == null) {
        store.clearSelection();
        return;
      }

      if (
          !store.facilitiesLoaded ||
          String(store.loadedOperatorProfileId) !== String(id)
      ) {
        await store.fetchFacilities(id);
      }

      if (cancelled) return;

      await store.selectFacility(requestedFacilityId, true);
    },
    {immediate: true}
);

function backToFacilities() {
  router.push({name: 'parking-management-facilities'});
}
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <pv-button
            :label="labels.title"
            icon="pi pi-arrow-left"
            text
            class="mb-2"
            @click="backToFacilities"/>

        <h1 v-if="facility" class="page-title">
          {{ facility.name }}
        </h1>

        <p v-if="facility" class="page-subtitle">
          {{ facility.address }}
        </p>
      </div>

      <pv-button
          v-if="facility"
          :label="labels.editZone"
          icon="pi pi-pencil"
          severity="secondary"
          outlined
          @click="dialogVisible = true"/>
    </div>

    <div
        v-if="!store.facilitiesLoaded"
        class="panel">
      <p class="empty-state">
        {{ t('parking-management.facilities.loading') }}
      </p>
    </div>

    <div
        v-else-if="!facility"
        class="panel">
      <p class="empty-state">
        {{ t('parking-management.facility-detail.not-found') }}
      </p>
    </div>

    <template v-else>
      <section class="panel">
        <dl class="information-grid">
          <div class="information-grid__item">
            <dt>{{ t('parking-management.fields.address') }}</dt>
            <dd>{{ facility.address }}</dd>
          </div>

          <div class="information-grid__item">
            <dt>{{ t('parking-management.facility-detail.schedule') }}</dt>
            <dd>{{ facility.openTime }} – {{ facility.closeTime }}</dd>
          </div>

          <div class="information-grid__item">
            <dt>{{ t('parking-management.facility-detail.rate') }}</dt>
            <dd>S/ {{ Number(facility.hourlyRate).toFixed(2) }}</dd>
          </div>

          <div class="information-grid__item">
            <dt>{{ t('parking-management.facility-detail.occupancy') }}</dt>
            <dd>
              {{ facility.occupiedSpots }}/{{ facility.totalSpots }}
              ({{ facility.occupancyRate }}%)
            </dd>
          </div>

          <div class="information-grid__item">
            <dt>{{ labels.availableSpots }}</dt>
            <dd>{{ facility.availableSpots }}</dd>
          </div>

          <div class="information-grid__item">
            <dt>{{ labels.reservedSpots }}</dt>
            <dd>{{ facility.reservedSpots }}</dd>
          </div>

          <div class="information-grid__item">
            <dt>{{ labels.maintenanceSpots }}</dt>
            <dd>{{ facility.maintenanceSpots }}</dd>
          </div>
        </dl>
      </section>

      <div v-if="!store.spotsLoaded" class="panel">
        <p class="empty-state">{{ labels.loadingMap }}</p>
      </div>

      <spot-list v-else/>
    </template>
  </section>

  <facility-form-dialog
      v-if="facility"
      v-model:visible="dialogVisible"
      :operator-profile-id="operatorProfileId"
      :facility="facility"/>
</template>

<style scoped>
.information-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 22px;
  margin: 0;
}

.information-grid__item {
  padding: 14px 0;
  border-bottom: 1px solid var(--ep-border);
}

.information-grid dt {
  margin-bottom: 7px;
  color: var(--ep-text-secondary);
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.information-grid dd {
  margin: 0;
  color: var(--ep-text);
  font-size: 14px;
  font-weight: 600;
}

@media (max-width: 800px) {
  .information-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 575px) {
  .information-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
