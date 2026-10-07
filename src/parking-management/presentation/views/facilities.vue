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

const summary = computed(() => {
  const total = store.facilities.length;
  const active = store.facilities.filter(facility => facility.isActive).length;
  const averageRate = total
      ? store.facilities.reduce((sum, facility) => sum + Number(facility.hourlyRate || 0), 0) / total
      : 0;
  return [
    {key: 'total', icon: 'pi pi-building', tone: 'info', value: total},
    {key: 'active', icon: 'pi pi-check-circle', tone: 'success', value: active},
    {key: 'average-rate', icon: 'pi pi-wallet', tone: 'warning', value: `S/ ${averageRate.toFixed(2)}`}
  ];
});

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

function statusTone(status) {
  return {ACTIVE: 'success', INACTIVE: 'muted', MAINTENANCE: 'warning'}[status] ?? 'muted';
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
      <div class="empty">
        <span class="icon-chip icon-chip--lg icon-chip--muted" aria-hidden="true"><i class="pi pi-building"></i></span>
        <p class="empty__text">{{ t('parking-management.facilities.empty') }}</p>
        <pv-button class="empty__action" :label="t('parking-management.facilities.new')" icon="pi pi-plus" @click="openCreate"/>
      </div>
    </div>

    <template v-else>
      <div class="stat-grid stat-grid--3">
        <article v-for="item in summary" :key="item.key" class="stat-card">
          <span class="icon-chip" :class="`icon-chip--${item.tone}`" aria-hidden="true"><i :class="item.icon"></i></span>
          <div class="stat-card__body">
            <span class="stat-card__label">{{ t(`parking-management.facilities.summary.${item.key}`) }}</span>
            <strong class="stat-card__value">{{ item.value }}</strong>
          </div>
        </article>
      </div>

      <div class="facility-grid">
        <article v-for="facility in store.facilities" :key="facility.id" class="facility-card"
                 role="button" tabindex="0" @click="openFacility(facility)" @keyup.enter="openFacility(facility)">
          <div class="facility-card__head">
            <span class="icon-chip icon-chip--info" aria-hidden="true"><i class="pi pi-building"></i></span>
            <h2 class="facility-card__name">{{ facility.name }}</h2>
            <span class="status-badge" :class="`status-badge--${statusTone(facility.status)}`">
              {{ t(`parking-management.facilities.status.${facility.status}`) }}
            </span>
          </div>

          <ul class="facility-card__details">
            <li>
              <i class="pi pi-map-marker" aria-hidden="true"></i>
              <span>{{ facility.address }}</span>
            </li>
            <li>
              <i class="pi pi-clock" aria-hidden="true"></i>
              <span>{{ facility.openTime }} – {{ facility.closeTime }}</span>
            </li>
          </ul>

          <div class="facility-card__foot">
            <div>
              <span class="detail-label">{{ t('parking-management.facility-detail.rate') }}</span>
              <strong class="facility-card__rate">S/ {{ facility.hourlyRate.toFixed(2) }}</strong>
            </div>
            <span class="facility-card__open">
              {{ t('parking-management.facilities.open') }}
              <i class="pi pi-arrow-right" aria-hidden="true"></i>
            </span>
          </div>
        </article>
      </div>
    </template>
  </section>

  <facility-form-dialog v-model:visible="dialogVisible" :operator-profile-id="operatorProfileId"/>
</template>

<style scoped>
.facility-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.facility-card {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--ep-border);
  border-radius: 12px;
  background: var(--ep-surface);
  box-shadow: var(--ep-shadow-sm);
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.facility-card:hover,
.facility-card:focus-visible {
  border-color: var(--ep-primary);
  box-shadow: var(--ep-shadow-md);
}

.facility-card__head {
  display: flex;
  align-items: center;
  gap: 12px;
}

.facility-card__name {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.35;
  color: var(--ep-text);
}

.facility-card__details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--ep-text-secondary);
  font-size: 13px;
}

.facility-card__details li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.facility-card__details i {
  color: var(--ep-text-tertiary);
  font-size: 13px;
}

.facility-card__foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid var(--ep-border);
}

.facility-card__foot .detail-label {
  display: block;
}

.facility-card__rate {
  font-size: 18px;
  font-weight: 700;
  color: var(--ep-text);
}

.facility-card__open {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ep-primary);
  font-size: 12px;
  font-weight: 600;
}

.facility-card__open i {
  font-size: 11px;
}
</style>
