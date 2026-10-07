<script setup>
import {onMounted, watch} from "vue";
import {useI18n} from "vue-i18n";

import useReservationsStore from "../../application/reservations.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";

import ReservationList from "../components/reservation-list.vue";

const {t} = useI18n();

const store =
    useReservationsStore();

const profilesStore =
    useProfilesStore();

onMounted(() => {
  if (!store.facilitiesLoaded) {
    store.fetchFacilities();
  }
});

watch(
    () =>
        profilesStore.currentProfile?.id,

    profileId => {
      if (profileId) {
        store.fetchReservations(
            profileId
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
          {{
            t(
                'reservations.my-reservations.title'
            )
          }}
        </h1>

        <p class="page-subtitle">
          {{
            t(
                'reservations.my-reservations.subtitle'
            )
          }}
        </p>
      </div>
    </div>

    <reservation-list/>
  </section>
</template>