<script setup>
import {computed, onMounted} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";

import useReservationsStore from "../../application/reservations.store.js";
import ReservationForm from "../components/reservation-form.vue";
import {easyParkUiLabels} from "../../../shared/presentation/easypark-ui-labels.js";

const {locale} = useI18n();
const router = useRouter();
const store = useReservationsStore();

const labels = computed(() =>
    easyParkUiLabels(locale.value)
);

onMounted(() => {
  if (!store.facilitiesLoaded) {
    store.fetchFacilities();
  }
});

function handleCreated() {
  router.push({
    name: 'reservations-my'
  });
}
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ labels.reservation.title }}
        </h1>

        <p class="page-subtitle">
          {{ labels.reservation.subtitle }}
        </p>
      </div>
    </div>

    <div
        v-if="!store.facilitiesLoaded"
        class="panel">

      <p class="empty-state">
        Loading...
      </p>
    </div>

    <reservation-form
        v-else
        @created="handleCreated"/>
  </section>
</template>