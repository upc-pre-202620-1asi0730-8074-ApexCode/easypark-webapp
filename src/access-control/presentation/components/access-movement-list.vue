<script setup>
import {useI18n} from "vue-i18n";
import useAccessControlStore from "../../application/access-control.store.js";

const {t, locale} = useI18n();
const store = useAccessControlStore();

function formatDate(value) {
  return new Intl.DateTimeFormat(
      locale.value,
      {
        dateStyle: 'short',
        timeStyle: 'short'
      }
  ).format(new Date(value));
}

function plateFor(movement) {
  return store
      .vehicleById(movement.vehicleId)
      ?.plateNumber.value ?? '—';
}

function statusClass(status) {
  if (status === 'COMPLETED') {
    return 'status-badge--success';
  }

  if (status === 'REJECTED') {
    return 'status-badge--danger';
  }

  return 'status-badge--info';
}
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <h2 class="panel-title">
        {{ t('access-control.movements.title') }}
      </h2>
    </div>

    <p
        v-if="!store.movements.length"
        class="empty-state">
      {{ t('access-control.movements.empty') }}
    </p>

    <table
        v-else
        class="movement-table">
      <thead>
      <tr>
        <th>{{ t('access-control.fields.time') }}</th>
        <th>{{ t('access-control.fields.plate') }}</th>
        <th>{{ t('access-control.fields.type') }}</th>
        <th>{{ t('access-control.fields.method') }}</th>
        <th>{{ t('access-control.fields.status') }}</th>
      </tr>
      </thead>

      <tbody>
      <tr
          v-for="movement in store.movements"
          :key="movement.id">

        <td>
          {{ formatDate(movement.occurredAt) }}
        </td>

        <td class="movement-table__plate">
          {{ plateFor(movement) }}
        </td>

        <td>
          {{ t(`access-control.types.${movement.type}`) }}
        </td>

        <td>
          {{ t(`access-control.methods.${movement.registrationMethod}`) }}
        </td>

        <td>
            <span
                class="status-badge"
                :class="statusClass(movement.status)">
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
  </section>
</template>

<style scoped>
.movement-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.movement-table th {
  padding: 10px 12px;
  background: var(--ep-page);
  color: var(--ep-text-secondary);
  font-size: 11px;
  text-align: left;
  text-transform: uppercase;
}

.movement-table td {
  padding: 12px;
  border-top: 1px solid var(--ep-border);
}

.movement-table__plate {
  font-weight: 700;
}
</style>