<script setup>
import {useI18n} from "vue-i18n";
import {useConfirm} from "primevue/useconfirm";
import {useToast} from "primevue/usetoast";
import useReservationsStore from "../../application/reservations.store.js";
import {ReservationStatus} from "../../domain/model/reservation-status.js";

const {t, locale} = useI18n();
const confirm = useConfirm();
const toast = useToast();
const store = useReservationsStore();

function findSpot(reservation) {
  for (const facility of store.facilities) {
    const spot =
        facility.spots.find(item =>
            item.id === reservation.parkingSpotId
        );

    if (spot) {
      return {facility, spot};
    }
  }

  return {
    facility: null,
    spot: null
  };
}

function formatDate(value) {
  return new Intl.DateTimeFormat(
      locale.value,
      {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
  ).format(new Date(value));
}

function canCancel(reservation) {
  return [
    ReservationStatus.PENDING,
    ReservationStatus.CONFIRMED
  ].includes(reservation.status);
}

function confirmCancellation(reservation) {
  confirm.require({
    header: t('reservations.cancel.title'),
    message: t('reservations.cancel.message', {
      code: reservation.code
    }),
    icon: 'pi pi-exclamation-triangle',

    rejectProps: {
      label: t('common.cancel'),
      severity: 'secondary',
      outlined: true
    },

    acceptProps: {
      label: t('reservations.cancel.accept'),
      severity: 'danger'
    },

    accept: async () => {
      const result =
          await store.cancelReservation(
              reservation.id
          );

      toast.add(
          result.success
              ? {
                severity: 'success',
                summary:
                    t('reservations.cancel.success'),
                life: 4000
              }
              : {
                severity: 'error',
                summary:
                    t('reservations.errors.failed'),
                life: 4000
              }
      );
    }
  });
}
</script>

<template>
  <section class="panel">
    <p
        v-if="!store.reservationsLoaded"
        class="empty-state">
      {{ t('reservations.list.loading') }}
    </p>

    <p
        v-else-if="!store.reservations.length"
        class="empty-state">
      {{ t('reservations.list.empty') }}
    </p>

    <div
        v-else
        class="reservation-list">

      <article
          v-for="reservation in store.reservations"
          :key="reservation.id"
          class="reservation-card">

        <div class="reservation-card__main">
          <div>
            <p class="reservation-card__code">
              {{ reservation.code }}
            </p>

            <p class="reservation-card__facility">
              {{
                findSpot(reservation).facility?.name
                ?? t('reservations.list.unknown-facility')
              }}
            </p>

            <p class="reservation-card__details">
              {{
                findSpot(reservation).spot?.code ?? '—'
              }}
              ·
              {{ formatDate(reservation.startAt) }}
              ·
              {{ reservation.durationMinutes }} min
            </p>
          </div>

          <div class="reservation-card__status">
            <span class="status-badge status-badge--info">
              {{
                t(
                    `reservations.status.${reservation.status}`
                )
              }}
            </span>

            <strong>
              S/ {{ Number(reservation.estimatedAmount).toFixed(2) }}
            </strong>
          </div>
        </div>

        <div
            v-if="canCancel(reservation)"
            class="reservation-card__actions">

          <pv-button
              :label="t('reservations.cancel.button')"
              severity="danger"
              outlined
              size="small"
              @click="confirmCancellation(reservation)"/>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.reservation-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reservation-card {
  padding: 16px;
  border: 1px solid var(--ep-border);
  border-radius: 10px;
}

.reservation-card__main {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.reservation-card__code {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  color: var(--ep-text-secondary);
}

.reservation-card__facility {
  margin: 0;
  font-weight: 700;
  color: var(--ep-text);
}

.reservation-card__details {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ep-text-secondary);
}

.reservation-card__status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.reservation-card__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--ep-border);
}

@media (max-width: 767px) {
  .reservation-card__main {
    flex-direction: column;
  }

  .reservation-card__status {
    align-items: flex-start;
  }
}
</style>