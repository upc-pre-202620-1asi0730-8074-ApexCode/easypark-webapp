<script setup>
import {onMounted} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import useReservationsStore from "../../application/reservations.store.js";
import ReservationForm from "../components/reservation-form.vue";

const {t} = useI18n();
const router = useRouter();
const store = useReservationsStore();

onMounted(() => {
  store.fetchFacilities();
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
          {{ t('reservations.create.title') }}
        </h1>

        <p class="page-subtitle">
          {{ t('reservations.create.subtitle') }}
        </p>
      </div>

      <pv-button
          :label="t('reservations.navigation.my-reservations')"
          severity="secondary"
          outlined
          @click="router.push({name: 'reservations-my'})"/>
    </div>

    <div
        v-if="!store.facilitiesLoaded"
        class="panel">
      <p class="empty-state">
        {{ t('reservations.create.loading') }}
      </p>
    </div>

    <reservation-form v-else @created="handleCreated"/>
  </section>
</template>