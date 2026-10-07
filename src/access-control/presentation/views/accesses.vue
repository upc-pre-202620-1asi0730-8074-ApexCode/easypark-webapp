<script setup>
import {computed, watch} from "vue";
import {useI18n} from "vue-i18n";

import useAccessControlStore from "../../application/access-control.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";

import AccessForm from "../components/access-form.vue";
import AccessMovementList from "../components/access-movement-list.vue";
import ParkingStayList from "../components/parking-stay-list.vue";

const {t} = useI18n();

const store = useAccessControlStore();
const profilesStore = useProfilesStore();

const facilityOptions = computed(() =>
    store.facilities.map(
        facility => ({
          label: facility.name,
          value: facility.id
        })
    )
);

const selectedFacilityId = computed({
  get() {
    return store.currentFacility?.id ?? null;
  },

  set(value) {
    store.selectFacility(value);
  }
});

watch(
    () => profilesStore.currentProfile?.id,
    async profileId => {
      if (!profileId) return;

      await store.fetchFacilities(profileId);

      if (store.facilities.length) {
        await store.selectFacility(
            store.facilities[0].id
        );
      }
    },
    {
      immediate: true
    }
);
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ t('access-control.title') }}
        </h1>

        <p class="page-subtitle">
          {{ t('access-control.subtitle') }}
        </p>
      </div>

      <pv-select
          v-if="store.facilities.length"
          v-model="selectedFacilityId"
          :options="facilityOptions"
          option-label="label"
          option-value="value"/>
    </div>

    <div
        v-if="!store.facilitiesLoaded"
        class="panel">
      <p class="empty-state">
        {{ t('access-control.loading') }}
      </p>
    </div>

    <div
        v-else-if="!store.facilities.length"
        class="panel">
      <p class="empty-state">
        {{ t('access-control.no-facilities') }}
      </p>
    </div>

    <template v-else>
      <div class="access-summary">
        <article class="panel access-summary__card">
          <span>
            {{ t('access-control.summary.total') }}
          </span>

          <strong>
            {{ store.spots.length }}
          </strong>
        </article>

        <article class="panel access-summary__card">
          <span>
            {{ t('access-control.summary.available') }}
          </span>

          <strong>
            {{ store.availableSpots.length }}
          </strong>
        </article>

        <article class="panel access-summary__card">
          <span>
            {{ t('access-control.summary.occupied') }}
          </span>

          <strong>
            {{ store.occupiedSpots.length }}
          </strong>
        </article>

        <article class="panel access-summary__card">
          <span>
            {{ t('access-control.summary.active-stays') }}
          </span>

          <strong>
            {{ store.activeStays.length }}
          </strong>
        </article>
      </div>

      <div
          v-if="!store.accessDataLoaded"
          class="panel">
        <p class="empty-state">
          {{ t('access-control.loading') }}
        </p>
      </div>

      <template v-else>
        <access-form/>

        <parking-stay-list/>

        <access-movement-list/>
      </template>
    </template>
  </section>
</template>

<style scoped>
.access-summary {
  display: grid;
  grid-template-columns:
      repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.access-summary__card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.access-summary__card span {
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.access-summary__card strong {
  color: var(--ep-text);
  font-size: 24px;
}

@media (max-width: 767px) {
  .access-summary {
    grid-template-columns:
        repeat(2, minmax(0, 1fr));
  }
}
</style>