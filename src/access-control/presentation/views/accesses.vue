<script setup>
import {
  computed,
  ref,
  watch
} from "vue";

import {useI18n} from "vue-i18n";

import useAccessControlStore from "../../application/access-control.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";

import AccessForm from "../components/access-form.vue";

import {easyParkUiLabels} from "../../../shared/presentation/easypark-ui-labels.js";

const {t, locale} = useI18n();

const store =
    useAccessControlStore();

const profilesStore =
    useProfilesStore();

const labels = computed(() =>
    easyParkUiLabels(locale.value)
);

const search = ref('');
const accessDialogVisible = ref(false);

const facilityOptions = computed(() =>
    store.facilities.map(
        facility => ({
          label:
          facility.name,
          value:
          facility.id
        })
    )
);

const selectedFacilityId =
    computed({
      get() {
        return (
            store.currentFacility?.id ??
            null
        );
      },

      set(value) {
        store.selectFacility(
            value
        );
      }
    });

watch(
    () =>
        profilesStore.currentProfile?.id,

    async profileId => {
      if (!profileId) {
        return;
      }

      await store.fetchFacilities(
          profileId
      );

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

function isToday(value) {
  if (!value) return false;

  const date =
      new Date(value);

  const today =
      new Date();

  return (
      date.getFullYear() ===
      today.getFullYear() &&
      date.getMonth() ===
      today.getMonth() &&
      date.getDate() ===
      today.getDate()
  );
}

const entriesToday = computed(() =>
    store.movements.filter(
        movement =>
            movement.type === 'ENTRY' &&
            movement.status === 'COMPLETED' &&
            isToday(
                movement.occurredAt
            )
    ).length
);

const exitsToday = computed(() =>
    store.movements.filter(
        movement =>
            movement.type === 'EXIT' &&
            movement.status === 'COMPLETED' &&
            isToday(
                movement.occurredAt
            )
    ).length
);

function movementById(id) {
  return store.movements.find(
      movement =>
          String(movement.id) ===
          String(id)
  ) ?? null;
}

const averageStayMinutes = computed(() => {
  const durations =
      store.stays
          .filter(
              stay =>
                  stay.entryMovementId &&
                  stay.exitMovementId
          )
          .map(stay => {
            const entry =
                movementById(
                    stay.entryMovementId
                );

            const exit =
                movementById(
                    stay.exitMovementId
                );

            if (!entry || !exit) {
              return null;
            }

            return Math.max(
                0,
                Math.round(
                    (
                        new Date(
                            exit.occurredAt
                        ) -
                        new Date(
                            entry.occurredAt
                        )
                    ) /
                    60000
                )
            );
          })
          .filter(
              value =>
                  Number.isFinite(value)
          );

  if (!durations.length) {
    return 0;
  }

  return Math.round(
      durations.reduce(
          (sum, value) =>
              sum + value,
          0
      ) /
      durations.length
  );
});

const incidents = computed(() =>
    store.movements.filter(
        movement =>
            [
              'UNDER_REVIEW',
              'REJECTED'
            ].includes(
                movement.status
            )
    )
);

function plateFor(movement) {
  return store.vehicles.find(
      vehicle =>
          String(vehicle.id) ===
          String(movement.vehicleId)
  )?.plateNumber?.value ?? '—';
}

function stayFor(movement) {
  return store.stays.find(
      stay =>
          String(stay.entryMovementId) ===
          String(movement.id) ||
          String(stay.exitMovementId) ===
          String(movement.id)
  ) ?? null;
}

function spotFor(movement) {
  const stay =
      stayFor(movement);

  if (!stay) {
    return null;
  }

  return store.spots.find(
      spot =>
          String(spot.id) ===
          String(stay.parkingSpotId)
  ) ?? null;
}

const filteredMovements = computed(() => {
  const term =
      search.value
          .trim()
          .toUpperCase();

  if (!term) {
    return store.movements;
  }

  return store.movements.filter(
      movement =>
          plateFor(movement)
              .toUpperCase()
              .includes(term)
  );
});

function formatTime(value) {
  return new Intl.DateTimeFormat(
      locale.value,
      {
        hour: 'numeric',
        minute: '2-digit'
      }
  ).format(
      new Date(value)
  );
}

function statusClass(status) {
  if (status === 'COMPLETED') {
    return 'status-badge--success';
  }

  if (status === 'REJECTED') {
    return 'status-badge--danger';
  }

  return 'status-badge--warning';
}

function averageStayLabel() {
  const minutes =
      averageStayMinutes.value;

  const hours =
      Math.floor(minutes / 60);

  const rest =
      minutes % 60;

  if (!hours) {
    return `${rest} min`;
  }

  return `${hours}h ${rest}m`;
}
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ labels.access.title }}
        </h1>

        <p class="page-subtitle">
          {{ labels.access.subtitle }}
        </p>
      </div>

      <pv-button
          :label="labels.access.scan"
          icon="pi pi-qrcode"
          @click="
            accessDialogVisible = true
          "/>
    </div>

    <div
        v-if="!store.facilitiesLoaded"
        class="panel">

      <p class="empty-state">
        {{
          t(
              'access-control.loading'
          )
        }}
      </p>
    </div>

    <div
        v-else-if="!store.facilities.length"
        class="panel">

      <p class="empty-state">
        {{
          t(
              'access-control.no-facilities'
          )
        }}
      </p>
    </div>

    <template v-else>
      <div class="access-summary">
        <article class="panel access-summary__card">
          <span>
            {{ labels.access.entries }}
          </span>

          <strong class="access-value--primary">
            {{ entriesToday }}
          </strong>
        </article>

        <article class="panel access-summary__card">
          <span>
            {{ labels.access.exits }}
          </span>

          <strong class="access-value--success">
            {{ exitsToday }}
          </strong>
        </article>

        <article class="panel access-summary__card">
          <span>
            {{ labels.access.averageStay }}
          </span>

          <strong>
            {{ averageStayLabel() }}
          </strong>
        </article>

        <article class="panel access-summary__card">
          <span>
            {{ labels.access.incidents }}
          </span>

          <strong class="access-value--warning">
            {{ incidents.length }}
          </strong>
        </article>
      </div>

      <div class="access-filters">
        <div class="access-search">
          <i class="pi pi-search"></i>

          <pv-input-text
              v-model="search"
              :placeholder="
                labels.access.search
              "/>
        </div>

        <pv-select
            v-model="selectedFacilityId"
            :options="facilityOptions"
            option-label="label"
            option-value="value"/>

        <div class="access-date">
          {{ labels.access.today }}
        </div>
      </div>

      <div
          v-if="!store.accessDataLoaded"
          class="panel">

        <p class="empty-state">
          {{
            t(
                'access-control.loading'
            )
          }}
        </p>
      </div>

      <div
          v-else
          class="access-content">

        <section class="panel access-registry">
          <h2 class="panel-title access-title">
            {{ labels.access.registry }}
          </h2>

          <p
              v-if="!filteredMovements.length"
              class="empty-state">

            {{
              t(
                  'access-control.movements.empty'
              )
            }}
          </p>

          <div
              v-else
              class="access-table-wrap">

            <table class="access-table">
              <thead>
              <tr>
                <th>
                  {{
                    t(
                        'access-control.fields.time'
                    )
                  }}
                </th>

                <th>
                  {{
                    t(
                        'access-control.fields.type'
                    )
                  }}
                </th>

                <th>
                  {{
                    t(
                        'access-control.fields.parking-spot'
                    )
                  }}
                </th>

                <th>
                  {{
                    t(
                        'access-control.fields.plate'
                    )
                  }}
                </th>

                <th>
                  {{
                    t(
                        'access-control.fields.method'
                    )
                  }}
                </th>

                <th>
                  {{
                    t(
                        'access-control.fields.status'
                    )
                  }}
                </th>
              </tr>
              </thead>

              <tbody>
              <tr
                  v-for="movement in filteredMovements"
                  :key="movement.id">

                <td>
                  {{
                    formatTime(
                        movement.occurredAt
                    )
                  }}
                </td>

                <td>
                  {{
                    t(
                        `access-control.types.${movement.type}`
                    )
                  }}
                </td>

                <td>
                  <strong>
                    {{
                      store.currentFacility?.name ??
                      '—'
                    }}
                  </strong>

                  <small>
                    {{
                      spotFor(movement)?.code ??
                      '—'
                    }}
                  </small>
                </td>

                <td>
                  {{ plateFor(movement) }}
                </td>

                <td>
                  {{
                    t(
                        `access-control.methods.${movement.registrationMethod}`
                    )
                  }}
                </td>

                <td>
                  <span
                      class="status-badge"
                      :class="
                        statusClass(
                          movement.status
                        )
                      ">
                    {{
                      t(
                          `access-control.status.${movement.status}`
                      )
                    }}
                  </span>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="panel access-alerts">
          <h2 class="panel-title access-title">
            {{ labels.access.alerts }}
          </h2>

          <p
              v-if="!incidents.length"
              class="empty-state">
            {{ labels.access.noAlerts }}
          </p>

          <article
              v-for="incident in incidents"
              :key="incident.id"
              class="access-alert">

            <span
                class="access-alert__icon"
                :class="
                  incident.status === 'REJECTED'
                    ? 'access-alert__icon--danger'
                    : 'access-alert__icon--warning'
                ">
              <i class="pi pi-exclamation-circle"></i>
            </span>

            <div>
              <strong>
                {{ plateFor(incident) }}
              </strong>

              <p>
                {{
                  t(
                      `access-control.status.${incident.status}`
                  )
                }}
              </p>

              <small>
                {{
                  formatTime(
                      incident.occurredAt
                  )
                }}
              </small>
            </div>
          </article>
        </section>
      </div>
    </template>
  </section>

  <pv-dialog
      v-model:visible="accessDialogVisible"
      :header="
        t(
            'access-control.form.title'
        )
      "
      modal
      :style="{
        width: 'min(680px, 95vw)'
      }">

    <access-form/>
  </pv-dialog>
</template>

<style scoped>
.access-summary {
  display: grid;
  grid-template-columns:
      repeat(4, minmax(0, 1fr));
  gap: 20px;
}

.access-summary__card {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.access-summary__card span {
  color: var(--ep-text-secondary);
  font-size: 12px;
}

.access-summary__card strong {
  font-size: 25px;
}

.access-value--primary {
  color: var(--ep-primary);
}

.access-value--success {
  color: var(--ep-success);
}

.access-value--warning {
  color: var(--ep-warning);
}

.access-filters {
  display: grid;
  grid-template-columns:
      minmax(300px, 1fr)
      180px
      100px;
  gap: 12px;
  margin-bottom: 20px;
}

.access-search {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 42px;
  padding: 0 14px;
  border: 1px solid var(--ep-border);
  border-radius: 8px;
  background: var(--ep-surface);
}

.access-search :deep(.p-inputtext) {
  border: 0;
  box-shadow: none;
  padding-left: 0;
}

.access-search i {
  color: var(--ep-text-secondary);
}

.access-date {
  display: grid;
  place-items: center;
  border: 1px solid var(--ep-border);
  border-radius: 8px;
  background: var(--ep-surface);
  color: var(--ep-text-secondary);
}

.access-content {
  display: grid;
  grid-template-columns:
      minmax(0, 1.7fr)
      minmax(300px, .8fr);
  gap: 20px;
}

.access-title {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--ep-border);
}

.access-table-wrap {
  overflow-x: auto;
}

.access-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.access-table th {
  padding: 10px 9px;
  color: var(--ep-text-secondary);
  font-size: 10px;
  text-align: left;
  text-transform: uppercase;
}

.access-table td {
  padding: 12px 9px;
  border-top: 1px solid var(--ep-border);
}

.access-table td:nth-child(3) {
  display: flex;
  flex-direction: column;
}

.access-table td:nth-child(3) small {
  color: var(--ep-text-secondary);
}

.access-alert {
  display: flex;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--ep-border);
}

.access-alert:last-child {
  border-bottom: 0;
}

.access-alert__icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  border-radius: 999px;
}

.access-alert__icon--danger {
  background: var(--ep-danger-bg);
  color: var(--ep-danger);
}

.access-alert__icon--warning {
  background: var(--ep-warning-bg);
  color: var(--ep-warning);
}

.access-alert strong {
  font-size: 13px;
}

.access-alert p,
.access-alert small {
  margin: 2px 0 0;
  color: var(--ep-text-secondary);
  font-size: 11px;
}

@media (max-width: 950px) {
  .access-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .access-summary {
    grid-template-columns:
        repeat(2, minmax(0, 1fr));
  }

  .access-filters {
    grid-template-columns: 1fr;
  }

  .access-date {
    min-height: 42px;
  }
}
</style>