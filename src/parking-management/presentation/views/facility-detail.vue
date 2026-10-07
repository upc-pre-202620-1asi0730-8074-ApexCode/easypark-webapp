<script setup>
import {computed, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import useProfilesStore from "../../../profiles/application/profiles.store.js";
import useParkingManagementStore from "../../application/parking-management.store.js";
import FacilityFormDialog from "../components/facility-form-dialog.vue";
import SpotList from "../components/spot-list.vue";

const {t} = useI18n();
const route = useRoute();
const router = useRouter();
const profilesStore = useProfilesStore();
const store = useParkingManagementStore();

const dialogVisible = ref(false);

const facilityId = computed(() => Number(route.params.facilityId));
const operatorProfileId = computed(() => profilesStore.currentProfile?.id ?? null);
const facility = computed(() => store.currentFacility);


watch([operatorProfileId, facilityId], async ([id]) => {
  if (!id) return;
  if (!store.facilitiesLoaded) await store.fetchFacilities(id);
  await store.selectFacility(facilityId.value);
}, {immediate: true});

function backToFacilities() {
  router.push({name: 'parking-management-facilities'});
}
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <pv-button :label="t('parking-management.facility-detail.back')" icon="pi pi-arrow-left" text class="mb-2" @click="backToFacilities"/>
        <h1 v-if="facility" class="page-title">{{ facility.name }}</h1>
      </div>
      <pv-button v-if="facility" :label="t('parking-management.facility-detail.edit')" severity="secondary" outlined @click="dialogVisible = true"/>
    </div>

    <div v-if="!store.facilitiesLoaded" class="panel" aria-busy="true">
      <p class="empty-state">{{ t('parking-management.facilities.loading') }}</p>
    </div>
    <div v-else-if="!facility" class="panel">
      <p class="empty-state">{{ t('parking-management.facility-detail.not-found') }}</p>
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
            <dd>S/ {{ facility.hourlyRate.toFixed(2) }}</dd>
          </div>
          <div class="information-grid__item">
            <dt>{{ t('parking-management.facility-detail.occupancy') }}</dt>
            <dd>{{ t('parking-management.facilities.occupancy', { occupied: facility.totalSpots - facility.availableSpots, total: facility.totalSpots }) }} ({{ facility.occupancyRate }}%)</dd>
          </div>
        </dl>
      </section>

      <spot-list v-if="store.spotsLoaded"/>
    </template>
  </section>

  <facility-form-dialog v-if="facility" v-model:visible="dialogVisible" :operator-profile-id="facility.operatorProfileId"/>
</template>

<style scoped>
.information-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 20px;
  margin: 0;
}

.information-grid__item {
  padding: 12px 0 16px;
  border-bottom: 1px solid var(--ep-border);
}

.information-grid dt {
  margin-bottom: 4px;
  color: var(--ep-text-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.information-grid dd {
  margin: 0;
  color: var(--ep-text);
  font-size: 14px;
}

@media (max-width: 767px) {
  .information-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
