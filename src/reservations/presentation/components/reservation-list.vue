<script setup>
import {computed} from "vue";
import {useI18n} from "vue-i18n";
import {useConfirm} from "primevue/useconfirm";
import {useToast} from "primevue/usetoast";

import useReservationsStore from "../../application/reservations.store.js";

import {ReservationStatus} from "../../domain/model/reservation-status.js";
import {easyParkUiLabels} from "../../../shared/presentation/easypark-ui-labels.js";

const {t, locale} = useI18n();
const confirm = useConfirm();
const toast = useToast();

const store =
    useReservationsStore();

const labels = computed(() =>
    easyParkUiLabels(locale.value)
);

function findSpot(reservation) {
  for (const facility of store.facilities) {
    const spot =
        facility.spots.find(
            item =>
                String(item.id) ===
                String(
                    reservation.parkingSpotId
                )
        );

    if (spot) {
      return {
        facility,
        spot
      };
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
        dateStyle: 'short'
      }
  ).format(
      new Date(value)
  );
}

function formatDateTime(value) {
  return new Intl.DateTimeFormat(
      locale.value,
      {
        dateStyle: 'medium',
        timeStyle: 'short'
      }
  ).format(
      new Date(value)
  );
}

function durationLabel(minutes) {
  const hours =
      Math.floor(minutes / 60);

  const rest =
      minutes % 60;

  if (!hours) {
    return `${rest} min`;
  }

  if (!rest) {
    return `${hours}h 00min`;
  }

  return `${hours}h ${rest}min`;
}

function canCancel(reservation) {
  return [
    ReservationStatus.PENDING,
    ReservationStatus.CONFIRMED
  ].includes(
      reservation.status
  );
}

function statusClass(status) {
  if (
      status === ReservationStatus.COMPLETED
  ) {
    return 'status-badge--success';
  }

  if (
      status === ReservationStatus.CANCELLED ||
      status === ReservationStatus.EXPIRED
  ) {
    return 'status-badge--danger';
  }

  return 'status-badge--info';
}

function confirmCancellation(reservation) {
  confirm.require({
    header:
        t(
            'reservations.cancel.title'
        ),

    message:
        t(
            'reservations.cancel.message',
            {
              code:
              reservation.code
            }
        ),

    icon:
        'pi pi-exclamation-triangle',

    rejectProps: {
      label:
          t(
              'common.cancel'
          ),
      severity:
          'secondary',
      outlined:
          true
    },

    acceptProps: {
      label:
          t(
              'reservations.cancel.accept'
          ),
      severity:
          'danger'
    },

    accept: async () => {
      const result =
          await store.cancelReservation(
              reservation.id
          );

      toast.add(
          result.success
              ? {
                severity:
                    'success',

                summary:
                    t(
                        'reservations.cancel.success'
                    ),

                life:
                    4000
              }
              : {
                severity:
                    'error',

                summary:
                    t(
                        'reservations.errors.failed'
                    ),

                life:
                    4000
              }
      );
    }
  });
}
</script>

<template>
  <div>
    <section
        v-if="!store.reservationsLoaded"
        class="panel">

      <p class="empty-state">
        {{
          t(
              'reservations.list.loading'
          )
        }}
      </p>
    </section>

    <section
        v-else-if="!store.reservations.length"
        class="panel">

      <p class="empty-state">
        {{
          t(
              'reservations.list.empty'
          )
        }}
      </p>
    </section>

    <template v-else>
      <section
          v-if="store.activeReservations.length"
          class="panel active-reservations">

        <h2 class="panel-title">
          {{ labels.reservations.active }}
        </h2>

        <article
            v-for="reservation in store.activeReservations"
            :key="reservation.id"
            class="active-reservation">

          <div class="active-reservation__icon">
            <i class="pi pi-car"></i>
          </div>

          <div class="active-reservation__information">
            <strong>
              {{
                findSpot(reservation)
                    .facility?.name ??
                t(
                    'reservations.list.unknown-facility'
                )
              }}
              —
              {{
                findSpot(reservation)
                    .spot?.code ??
                '—'
              }}
            </strong>

            <span>
              {{
                formatDateTime(
                    reservation.startAt
                )
              }}
              ·
              {{
                durationLabel(
                    reservation.durationMinutes
                )
              }}
            </span>
          </div>

          <span
              class="status-badge status-badge--info">
            {{
              t(
                  `reservations.status.${reservation.status}`
              )
            }}
          </span>

          <pv-button
              v-if="canCancel(reservation)"
              :label="
                t(
                    'reservations.cancel.button'
                )
              "
              severity="secondary"
              outlined
              size="small"
              @click="
                confirmCancellation(
                  reservation
                )
              "/>
        </article>
      </section>

      <section class="panel history-panel">
        <h2 class="panel-title history-title">
          {{ labels.reservations.history }}
        </h2>

        <p
            v-if="!store.reservationHistory.length"
            class="empty-state">
          —
        </p>

        <div
            v-else
            class="reservation-table-wrap">

          <table class="reservation-table">
            <thead>
            <tr>
              <th>
                {{ labels.reservations.zoneSpace }}
              </th>

              <th>
                {{ labels.reservations.date }}
              </th>

              <th>
                {{ labels.reservations.duration }}
              </th>

              <th>
                {{ labels.reservations.amount }}
              </th>

              <th>
                {{ labels.reservations.status }}
              </th>
            </tr>
            </thead>

            <tbody>
            <tr
                v-for="reservation in store.reservationHistory"
                :key="reservation.id">

              <td>
                <strong>
                  {{
                    findSpot(reservation)
                        .facility?.name ??
                    t(
                        'reservations.list.unknown-facility'
                    )
                  }}
                </strong>

                <small>
                  {{
                    findSpot(reservation)
                        .spot?.code ??
                    '—'
                  }}
                </small>
              </td>

              <td>
                {{
                  formatDate(
                      reservation.startAt
                  )
                }}
              </td>

              <td>
                {{
                  durationLabel(
                      reservation.durationMinutes
                  )
                }}
              </td>

              <td>
                S/
                {{
                  Number(
                      reservation.estimatedAmount
                  ).toFixed(2)
                }}
              </td>

              <td>
                <span
                    class="status-badge"
                    :class="
                      statusClass(
                        reservation.status
                      )
                    ">
                  {{
                    t(
                        `reservations.status.${reservation.status}`
                    )
                  }}
                </span>
              </td>
            </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.active-reservations {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.active-reservation {
  display: grid;
  grid-template-columns:
      auto
      minmax(0, 1fr)
      auto
      auto;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.active-reservation__icon {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border-radius: 10px;
  background: #e0edff;
  color: var(--ep-primary);
}

.active-reservation__information {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.active-reservation__information strong {
  font-size: 14px;
}

.active-reservation__information span {
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.history-title {
  margin-bottom: 16px;
}

.reservation-table-wrap {
  overflow-x: auto;
  margin: 0 -24px -24px;
}

.reservation-table {
  width: 100%;
  border-collapse: collapse;
}

.reservation-table th {
  padding: 12px 24px;
  background: var(--ep-page);
  color: var(--ep-text-secondary);
  font-size: 11px;
  text-align: left;
  text-transform: uppercase;
}

.reservation-table td {
  padding: 13px 24px;
  border-top: 1px solid var(--ep-border);
}

.reservation-table td:first-child {
  display: flex;
  flex-direction: column;
}

.reservation-table small {
  margin-top: 2px;
  color: var(--ep-text-secondary);
}

@media (max-width: 700px) {
  .active-reservation {
    grid-template-columns:
        auto
        1fr;
  }

  .active-reservation > :nth-child(3),
  .active-reservation > :nth-child(4) {
    grid-column: 2;
  }
}
</style>