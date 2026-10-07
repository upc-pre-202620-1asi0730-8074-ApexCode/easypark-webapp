<script setup>
import {computed, ref, watch} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import useProfilesStore from "../../../profiles/application/profiles.store.js";
import useParkingManagementStore from "../../application/parking-management.store.js";
import FacilityFormDialog from "../components/facility-form-dialog.vue";

const {t} = useI18n();
const router = useRouter();
const profilesStore = useProfilesStore();
const store = useParkingManagementStore();

const dialogVisible = ref(false);

const operatorProfileId = computed(() => profilesStore.currentProfile?.id ?? null);

watch(operatorProfileId, (id) => {
  if (id) store.fetchFacilities(id);
}, {immediate: true});

function openCreate() {
  store.clearSelection();
  dialogVisible.value = true;
}

function openFacility(facility) {
  router.push({name: 'parking-management-facility-detail', params: {facilityId: facility.id}});
}

function statusSeverity(status) {
  return {ACTIVE: 'success', INACTIVE: 'secondary', MAINTENANCE: 'warn'}[status] ?? 'secondary';
}
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('parking-management.facilities.title') }}</h1>
        <p class="page-subtitle">{{ t('parking-management.facilities.subtitle') }}</p>
      </div>
      <pv-button :label="t('parking-management.facilities.new')" icon="pi pi-plus" @click="openCreate"/>
    </div>

    <div v-if="!store.facilitiesLoaded" class="panel" aria-busy="true">
      <p class="empty-state">{{ t('parking-management.facilities.loading') }}</p>
    </div>
    <div v-else-if="!store.facilities.length" class="panel">
      <p class="empty-state">{{ t('parking-management.facilities.empty') }}</p>
    </div>
    <div v-else class="facility-grid">
      <article v-for="facility in store.facilities" :key="facility.id" class="panel facility-card"
               role="button" tabindex="0" @click="openFacility(facility)" @keyup.enter="openFacility(facility)">
        <div class="panel-header">
          <h2 class="panel-title">{{ facility.name }}</h2>
          <pv-tag :value="t(`parking-management.facilities.status.${facility.status}`)" :severity="statusSeverity(facility.status)"/>
        </div>
        <p class="facility-card__address">{{ facility.address }}</p>
        <p class="facility-card__rate">{{ t('parking-management.facility-detail.rate') }}: S/ {{ facility.hourlyRate.toFixed(2) }}</p>
      </article>
    </div>
  </section>

  <facility-form-dialog v-model:visible="dialogVisible" :operator-profile-id="operatorProfileId"/>
</template>

<style scoped>
.facility-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.facility-card {
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.facility-card:hover,
.facility-card:focus-visible {
  border-color: var(--ep-primary);
}

.facility-card__address {
  margin: 0 0 8px;
  color: var(--ep-text-secondary);
  font-size: 13px;
}

.facility-card__rate {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--ep-text);
}
</style>
