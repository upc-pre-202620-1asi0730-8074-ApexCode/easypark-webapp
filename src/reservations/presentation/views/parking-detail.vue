<script setup>
import {computed, onMounted} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useI18n} from "vue-i18n";

import useReservationsStore from "../../application/reservations.store.js";
import {easyParkUiLabels} from "../../../shared/presentation/easypark-ui-labels.js";

const {locale} = useI18n();
const route = useRoute();
const router = useRouter();
const store = useReservationsStore();

const labels = computed(() =>
    easyParkUiLabels(locale.value)
);

const sameId = (a, b) =>
    a != null &&
    b != null &&
    String(a) === String(b);

onMounted(async () => {
  if (!store.facilitiesLoaded) {
    await store.fetchFacilities();
  }
});

const facility = computed(() =>
    store.facilities.find(
        item =>
            sameId(
                item.id,
                route.params.facilityId
            )
    ) ?? null
);

const alternatives = computed(() => {
  if (!facility.value) {
    return [];
  }

  return store.facilities
      .filter(item =>
          item.isActive &&
          !sameId(
              item.id,
              facility.value.id
          )
      )
      .sort(
          (a, b) =>
              Number(a.hourlyRate) -
              Number(b.hourlyRate)
      )
      .slice(0, 3);
});

function reserve() {
  if (!facility.value) return;

  router.push({
    name: 'reservations-create',
    query: {
      facilityId:
      facility.value.id
    }
  });
}

function openAlternative(item) {
  router.push({
    name: 'reservations-parking-detail',
    params: {
      facilityId: item.id
    }
  });
}
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ labels.detail.title }}
        </h1>

        <p class="page-subtitle">
          {{ labels.detail.subtitle }}
        </p>
      </div>

      <pv-button
          :label="labels.detail.back"
          icon="pi pi-arrow-left"
          severity="secondary"
          outlined
          @click="router.push({name: 'home'})"/>
    </div>

    <div
        v-if="!store.facilitiesLoaded"
        class="panel">

      <p class="empty-state">
        Loading...
      </p>
    </div>

    <div
        v-else-if="!facility"
        class="panel">

      <p class="empty-state">
        Parking facility not found.
      </p>
    </div>

    <div
        v-else
        class="parking-detail">

      <section class="panel parking-detail__main">
        <div class="parking-detail__map">
          <span class="parking-detail__map-marker">
            <i class="pi pi-map-marker"></i>
          </span>
        </div>

        <div class="parking-detail__heading">
          <div>
            <h2>
              {{ facility.name }}
            </h2>

            <p>
              {{ facility.address }}
            </p>
          </div>

          <span
              class="status-badge"
              :class="
                facility.availableSpots > 0
                    ? 'status-badge--success'
                    : 'status-badge--danger'
              ">
            {{
              facility.availableSpots > 0
                  ? labels.detail.available
                  : labels.detail.unavailable
            }}
          </span>
        </div>

        <div class="parking-detail__metrics">
          <div>
            <span>
              {{ labels.detail.price }}
            </span>

            <strong>
              S/
              {{
                Number(
                    facility.hourlyRate
                ).toFixed(2)
              }}
              /
              {{ labels.detail.perHour }}
            </strong>
          </div>

          <div>
            <span>
              {{ labels.detail.spaces }}
            </span>

            <strong>
              {{ facility.availableSpots }}
              {{ labels.detail.freeSpaces }}
            </strong>
          </div>

          <div>
            <span>
              {{ labels.detail.schedule }}
            </span>

            <strong>
              {{ facility.openTime }}
              –
              {{ facility.closeTime }}
            </strong>
          </div>
        </div>

        <h3>
          {{ labels.detail.features }}
        </h3>

        <div class="parking-detail__features">
          <span>
            <i class="pi pi-clock"></i>
            {{ facility.openTime }}
            –
            {{ facility.closeTime }}
          </span>

          <span>
            <i class="pi pi-car"></i>
            {{ facility.totalSpots }}
            spaces
          </span>

          <span>
            <i class="pi pi-check-circle"></i>
            {{ facility.availableSpots }}
            available
          </span>
        </div>
      </section>

      <aside class="parking-detail__aside">
        <section class="panel">
          <h2 class="panel-title">
            {{ labels.detail.alternatives }}
          </h2>

          <p
              v-if="!alternatives.length"
              class="empty-state">
            —
          </p>

          <button
              v-for="item in alternatives"
              :key="item.id"
              type="button"
              class="alternative"
              @click="openAlternative(item)">

            <div>
              <strong>
                {{ item.name }}
              </strong>

              <small>
                {{ item.availableSpots }}
                {{ labels.detail.freeSpaces }}
              </small>
            </div>

            <strong>
              S/
              {{
                Number(
                    item.hourlyRate
                ).toFixed(2)
              }}/h
            </strong>
          </button>
        </section>

        <section class="panel parking-detail__actions">
          <pv-button
              :label="labels.detail.reserve"
              fluid
              :disabled="facility.availableSpots === 0"
              @click="reserve"/>

          <pv-button
              :label="labels.detail.compare"
              severity="secondary"
              outlined
              fluid
              @click="router.push({name: 'home'})"/>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.parking-detail {
  display: grid;
  grid-template-columns:
      minmax(0, 1.7fr)
      minmax(300px, .9fr);
  gap: 20px;
}

.parking-detail__main {
  margin: 0;
}

.parking-detail__map {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 220px;
  margin-bottom: 20px;
  border-radius: 12px;
  background:
      linear-gradient(
          135deg,
          #eaf3ff,
          #dbeafe
      );
}

.parking-detail__map-marker {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: var(--ep-primary);
  color: white;
  font-size: 20px;
}

.parking-detail__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
}

.parking-detail__heading h2 {
  margin: 0;
  font-size: 22px;
}

.parking-detail__heading p {
  margin: 7px 0 0;
  color: var(--ep-text-secondary);
}

.parking-detail__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 34px;
  margin-top: 22px;
}

.parking-detail__metrics div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.parking-detail__metrics span {
  color: var(--ep-text-secondary);
  font-size: 11px;
  text-transform: uppercase;
}

.parking-detail__metrics strong {
  font-size: 16px;
}

.parking-detail h3 {
  margin: 22px 0 12px;
  font-size: 15px;
}

.parking-detail__features {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.parking-detail__features span {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 13px;
  border-radius: 8px;
  background: var(--ep-page);
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.parking-detail__aside {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.alternative {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  width: 100%;
  padding: 15px 0;
  border: 0;
  border-bottom: 1px solid var(--ep-border);
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}

.alternative div {
  display: flex;
  flex-direction: column;
}

.alternative small {
  margin-top: 3px;
  color: var(--ep-text-secondary);
}

.parking-detail__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

@media (max-width: 900px) {
  .parking-detail {
    grid-template-columns: 1fr;
  }
}
</style>