<script setup>
import {
  computed,
  reactive,
  ref,
  watch
} from "vue";

import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";

import useReservationsStore from "../../application/reservations.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";

import {CreateReservationCommand} from "../../domain/model/create-reservation.command.js";
import {easyParkUiLabels} from "../../../shared/presentation/easypark-ui-labels.js";

const emit = defineEmits(['created']);

const {t, locale} = useI18n();
const route = useRoute();
const toast = useToast();

const store = useReservationsStore();
const profilesStore = useProfilesStore();

const labels = computed(() =>
    easyParkUiLabels(locale.value)
);

function inputDate(date) {
  const year = date.getFullYear();

  const month =
      String(
          date.getMonth() + 1
      ).padStart(2, '0');

  const day =
      String(
          date.getDate()
      ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

const tomorrow =
    new Date(
        Date.now() + 86400000
    );

const form = reactive({
  parkingFacilityId: null,
  vehicleId: null,
  date: inputDate(tomorrow),
  time: '18:30',
  durationMinutes: 120
});

const submitted = ref(false);
const loading = ref(false);
const failureReason = ref(null);

const facilityOptions = computed(() =>
    store.facilities.map(facility => ({
      label:
          `${facility.name} · S/ ${Number(
              facility.hourlyRate
          ).toFixed(2)}/h`,
      value: facility.id
    }))
);

const vehicleOptions = computed(() =>
    profilesStore.vehicles.map(vehicle => ({
      label:
      vehicle.plateNumber.value,
      value:
      vehicle.id
    }))
);

const durationOptions = [
  {
    label: '30 min',
    value: 30
  },
  {
    label: '1 h',
    value: 60
  },
  {
    label: '1 h 30 min',
    value: 90
  },
  {
    label: '2 h',
    value: 120
  },
  {
    label: '3 h',
    value: 180
  },
  {
    label: '4 h',
    value: 240
  }
];

const selectedFacility = computed(() =>
    store.facilities.find(
        facility =>
            String(facility.id) ===
            String(form.parkingFacilityId)
    ) ?? null
);

const selectedDuration = computed(() =>
    durationOptions.find(
        item =>
            item.value ===
            form.durationMinutes
    )?.label ?? ''
);

const estimatedAmount = computed(() => {
  if (!selectedFacility.value) {
    return 0;
  }

  return Number(
      (
          Number(
              selectedFacility.value
                  .hourlyRate
          ) *
          (
              Number(
                  form.durationMinutes
              ) /
              60
          )
      ).toFixed(2)
  );
});

watch(
    [
      () => route.query.facilityId,
      () => store.facilities.length
    ],
    ([facilityId]) => {
      if (!store.facilities.length) {
        return;
      }

      const requested =
          store.facilities.find(
              facility =>
                  String(facility.id) ===
                  String(facilityId)
          );

      form.parkingFacilityId =
          requested?.id ??
          form.parkingFacilityId ??
          store.facilities[0].id;
    },
    {
      immediate: true
    }
);

watch(
    () => profilesStore.vehicles.length,
    () => {
      if (
          form.vehicleId ||
          !profilesStore.vehicles.length
      ) {
        return;
      }

      form.vehicleId =
          profilesStore.vehicles.find(
              vehicle =>
                  vehicle.isDefault
          )?.id ??
          profilesStore.vehicles[0].id;
    },
    {
      immediate: true
    }
);

const hasErrors = computed(() =>
    !form.parkingFacilityId ||
    !form.vehicleId ||
    !form.date ||
    !form.time ||
    !form.durationMinutes
);

async function performSave() {
  submitted.value = true;
  failureReason.value = null;

  if (hasErrors.value) {
    return;
  }

  const startAt =
      new Date(
          `${form.date}T${form.time}`
      );

  if (
      Number.isNaN(
          startAt.getTime()
      ) ||
      startAt <= new Date()
  ) {
    failureReason.value =
        'invalid-start';

    return;
  }

  loading.value = true;

  const result =
      await store.createReservation(
          new CreateReservationCommand({
            driverProfileId:
            profilesStore.currentProfile.id,

            vehicleId:
            form.vehicleId,

            parkingFacilityId:
            form.parkingFacilityId,

            startAt:
                startAt.toISOString(),

            durationMinutes:
            form.durationMinutes
          })
      );

  loading.value = false;

  if (!result.success) {
    failureReason.value =
        result.reason;

    return;
  }

  toast.add({
    severity: 'success',
    summary:
        t(
            'reservations.form.created'
        ),
    life: 4000
  });

  emit('created');
}
</script>

<template>
  <div class="reservation-layout">
    <section class="panel reservation-form-card">
      <pv-message
          v-if="failureReason"
          severity="error"
          class="mb-4"
          role="alert">

        {{
          t(
              `reservations.errors.${failureReason}`
          )
        }}
      </pv-message>

      <form
          id="reservation-form"
          novalidate
          @submit.prevent="performSave">

        <div class="reservation-facility">
          <div class="reservation-facility__image">
            <i class="pi pi-map-marker"></i>
          </div>

          <div>
            <strong>
              {{
                selectedFacility?.name ??
                'EasyPark'
              }}
            </strong>

            <p v-if="selectedFacility">
              {{ selectedFacility.address }}
              · S/
              {{
                Number(
                    selectedFacility.hourlyRate
                ).toFixed(2)
              }}
              / h
            </p>
          </div>
        </div>

        <div class="form-field">
          <label
              for="reservation-facility"
              class="form-label">

            {{
              t(
                  'reservations.fields.facility'
              )
            }}
          </label>

          <pv-select
              input-id="reservation-facility"
              v-model="form.parkingFacilityId"
              :options="facilityOptions"
              option-label="label"
              option-value="value"
              :invalid="
                submitted &&
                !form.parkingFacilityId
              "/>
        </div>

        <div class="form-field">
          <label
              for="reservation-date"
              class="form-label">
            {{ labels.reservation.date }}
          </label>

          <input
              id="reservation-date"
              v-model="form.date"
              class="reservation-native-input"
              type="date"/>
        </div>

        <div class="form-grid">
          <div class="form-field">
            <label
                for="reservation-time"
                class="form-label">
              {{ labels.reservation.time }}
            </label>

            <input
                id="reservation-time"
                v-model="form.time"
                class="reservation-native-input"
                type="time"/>
          </div>

          <div class="form-field">
            <label
                for="reservation-duration"
                class="form-label">

              {{
                t(
                    'reservations.fields.duration'
                )
              }}
            </label>

            <pv-select
                input-id="reservation-duration"
                v-model="form.durationMinutes"
                :options="durationOptions"
                option-label="label"
                option-value="value"/>
          </div>
        </div>

        <div class="form-field">
          <label
              for="reservation-vehicle"
              class="form-label">

            {{
              t(
                  'reservations.fields.vehicle'
              )
            }}
          </label>

          <pv-select
              input-id="reservation-vehicle"
              v-model="form.vehicleId"
              :options="vehicleOptions"
              option-label="label"
              option-value="value"
              :invalid="
                submitted &&
                !form.vehicleId
              "/>
        </div>
      </form>
    </section>

    <aside class="panel reservation-summary">
      <h2 class="panel-title">
        {{ labels.reservation.summary }}
      </h2>

      <div class="reservation-summary__line">
        <span>
          {{ labels.reservation.hourlyRate }}
        </span>

        <span>
          S/
          {{
            Number(
                selectedFacility?.hourlyRate ??
                0
            ).toFixed(2)
          }}
        </span>
      </div>

      <div class="reservation-summary__line">
        <span>
          {{ labels.reservation.duration }}
        </span>

        <span>
          {{ selectedDuration }}
        </span>
      </div>

      <div class="reservation-summary__total">
        <span>
          {{ labels.reservation.total }}
        </span>

        <strong>
          S/
          {{ estimatedAmount.toFixed(2) }}
        </strong>
      </div>

      <pv-button
          type="submit"
          form="reservation-form"
          :label="t('reservations.form.confirm')"
          :loading="loading"
          :disabled="
            !profilesStore.vehicles.length
          "
          fluid/>

      <small class="reservation-summary__hint">
        {{ labels.reservation.confirmation }}
      </small>
    </aside>
  </div>
</template>

<style scoped>
.reservation-layout {
  display: grid;
  grid-template-columns:
      minmax(0, 1.4fr)
      minmax(300px, .9fr);
  gap: 20px;
}

.reservation-form-card {
  margin: 0;
}

.reservation-facility {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--ep-border);
}

.reservation-facility__image {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 11px;
  background: var(--ep-primary-soft);
  color: var(--ep-primary);
}

.reservation-facility strong {
  font-size: 14px;
}

.reservation-facility p {
  margin: 4px 0 0;
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.reservation-native-input {
  min-height: 42px;
  padding: 0 12px;
  border: 1px solid var(--ep-border);
  border-radius: 8px;
  background: var(--ep-surface);
  color: var(--ep-text);
  font: inherit;
}

.reservation-summary {
  align-self: start;
}

.reservation-summary__line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  color: var(--ep-text-secondary);
}

.reservation-summary__total {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin: 16px 0 24px;
  padding-top: 16px;
  border-top: 1px solid var(--ep-border);
}

.reservation-summary__total strong {
  font-size: 24px;
}

.reservation-summary__hint {
  display: block;
  margin-top: 12px;
  color: var(--ep-text-tertiary);
  text-align: center;
}

@media (max-width: 850px) {
  .reservation-layout {
    grid-template-columns: 1fr;
  }
}
</style>