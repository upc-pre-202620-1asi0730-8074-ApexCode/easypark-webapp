<script setup>
import {computed, reactive, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";
import useReservationsStore from "../../application/reservations.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";
import {CreateReservationCommand} from "../../domain/model/create-reservation.command.js";

const emit = defineEmits(['created']);

const {t} = useI18n();
const toast = useToast();
const store = useReservationsStore();
const profilesStore = useProfilesStore();

const form = reactive({
  parkingFacilityId: null,
  vehicleId: null,
  startAt: '',
  durationMinutes: 120
});

const submitted = ref(false);
const loading = ref(false);
const failureReason = ref(null);

const facilityOptions = computed(() =>
    store.facilities.map(facility => ({
      label: `${facility.name} · S/ ${Number(facility.hourlyRate).toFixed(2)}/h`,
      value: facility.id
    }))
);

const vehicleOptions = computed(() =>
    profilesStore.vehicles.map(vehicle => ({
      label: `${vehicle.plateNumber.value} · ${t(`profiles.vehicle-types.${vehicle.type}`)}`,
      value: vehicle.id
    }))
);

const durationOptions = [
  {label: '30 min', value: 30},
  {label: '1 h', value: 60},
  {label: '1 h 30 min', value: 90},
  {label: '2 h', value: 120},
  {label: '3 h', value: 180},
  {label: '4 h', value: 240}
];

const selectedFacility = computed(() =>
    store.facilities.find(facility =>
        facility.id === form.parkingFacilityId
    )
);

const estimatedAmount = computed(() => {
  if (!selectedFacility.value) return 0;

  return Number(
      (
          Number(selectedFacility.value.hourlyRate) *
          (Number(form.durationMinutes) / 60)
      ).toFixed(2)
  );
});

const hasErrors = computed(() =>
    !form.parkingFacilityId ||
    !form.vehicleId ||
    !form.startAt ||
    !form.durationMinutes
);

async function performSave() {
  submitted.value = true;
  failureReason.value = null;

  if (hasErrors.value) return;

  const startAt = new Date(form.startAt);

  if (
      Number.isNaN(startAt.getTime()) ||
      startAt <= new Date()
  ) {
    failureReason.value = 'invalid-start';
    return;
  }

  loading.value = true;

  const result = await store.createReservation(
      new CreateReservationCommand({
        driverProfileId:
        profilesStore.currentProfile.id,
        vehicleId: form.vehicleId,
        parkingFacilityId:
        form.parkingFacilityId,
        startAt: startAt.toISOString(),
        durationMinutes:
        form.durationMinutes
      })
  );

  loading.value = false;

  if (!result.success) {
    failureReason.value = result.reason;
    return;
  }

  toast.add({
    severity: 'success',
    summary: t('reservations.form.created'),
    life: 4000
  });

  emit('created');
}
</script>

<template>
  <section class="panel">
    <pv-message
        v-if="failureReason"
        severity="error"
        class="mb-4"
        role="alert">
      {{ t(`reservations.errors.${failureReason}`) }}
    </pv-message>

    <form
        id="reservation-form"
        novalidate
        @submit.prevent="performSave">

      <div class="form-field">
        <label
            for="reservation-facility"
            class="form-label">
          {{ t('reservations.fields.facility') }}
        </label>

        <pv-select
            input-id="reservation-facility"
            v-model="form.parkingFacilityId"
            :options="facilityOptions"
            option-label="label"
            option-value="value"
            :invalid="submitted && !form.parkingFacilityId"/>
      </div>

      <div class="form-field">
        <label
            for="reservation-start"
            class="form-label">
          {{ t('reservations.fields.start') }}
        </label>

        <pv-input-text
            id="reservation-start"
            v-model="form.startAt"
            type="datetime-local"
            :invalid="submitted && !form.startAt"/>
      </div>

      <div class="form-grid">
        <div class="form-field">
          <label
              for="reservation-duration"
              class="form-label">
            {{ t('reservations.fields.duration') }}
          </label>

          <pv-select
              input-id="reservation-duration"
              v-model="form.durationMinutes"
              :options="durationOptions"
              option-label="label"
              option-value="value"/>
        </div>

        <div class="form-field">
          <label
              for="reservation-vehicle"
              class="form-label">
            {{ t('reservations.fields.vehicle') }}
          </label>

          <pv-select
              input-id="reservation-vehicle"
              v-model="form.vehicleId"
              :options="vehicleOptions"
              option-label="label"
              option-value="value"
              :invalid="submitted && !form.vehicleId"/>
        </div>
      </div>

      <div
          v-if="selectedFacility"
          class="reservation-summary">
        <span>{{ t('reservations.fields.estimated-amount') }}</span>
        <strong>S/ {{ estimatedAmount.toFixed(2) }}</strong>
      </div>

      <pv-button
          type="submit"
          :label="t('reservations.form.confirm')"
          :loading="loading"
          :disabled="!profilesStore.vehicles.length"/>
    </form>
  </section>
</template>

<style scoped>
.reservation-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 20px 0;
  padding: 16px;
  border-radius: 10px;
  background: var(--ep-page);
  color: var(--ep-text);
}
</style>