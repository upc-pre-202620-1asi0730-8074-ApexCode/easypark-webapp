<script setup>
import {computed, ref} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";

import useAccessControlStore from "../../application/access-control.store.js";
import {ReassignSpaceCommand} from "../../domain/model/reassign-space.command.js";

const {t, locale} = useI18n();
const toast = useToast();
const store = useAccessControlStore();

const dialogVisible = ref(false);
const selectedStay = ref(null);
const selectedSpotId = ref(null);
const loading = ref(false);

const spotOptions = computed(() => {
  if (!selectedStay.value) return [];

  const entry =
      store.movementById(
          selectedStay.value.entryMovementId
      );

  const vehicle =
      store.vehicleById(
          entry?.vehicleId
      );

  return store.availableSpots
      .filter(
          spot =>
              !vehicle?.type ||
              spot.type === vehicle.type
      )
      .map(spot => ({
        label: `${spot.code} · ${spot.type}`,
        value: spot.id
      }));
});

function entryMovement(stay) {
  return store.movementById(
      stay.entryMovementId
  );
}

function vehicleFor(stay) {
  const movement =
      entryMovement(stay);

  return store.vehicleById(
      movement?.vehicleId
  );
}

function formatDate(value) {
  if (!value) return '—';

  return new Intl.DateTimeFormat(
      locale.value,
      {
        dateStyle: 'short',
        timeStyle: 'short'
      }
  ).format(new Date(value));
}

function openReassign(stay) {
  selectedStay.value = stay;
  selectedSpotId.value = null;
  dialogVisible.value = true;
}

async function performReassign() {
  if (
      !selectedStay.value ||
      !selectedSpotId.value
  ) {
    return;
  }

  loading.value = true;

  const result =
      await store.reassignStay(
          new ReassignSpaceCommand({
            parkingStayId:
            selectedStay.value.id,
            parkingSpotId:
            selectedSpotId.value
          })
      );

  loading.value = false;

  if (!result.success) {
    toast.add({
      severity: 'error',
      summary:
          t('access-control.errors.failed'),
      life: 4000
    });

    return;
  }

  toast.add({
    severity: 'success',
    summary:
        t('access-control.messages.reassigned'),
    life: 4000
  });

  dialogVisible.value = false;
}
</script>

<template>
  <section class="panel">
    <div class="panel-header">
      <h2 class="panel-title">
        {{ t('access-control.stays.title') }}
      </h2>
    </div>

    <p
        v-if="!store.activeStays.length"
        class="empty-state">
      {{ t('access-control.stays.empty') }}
    </p>

    <div
        v-else
        class="stay-list">

      <article
          v-for="stay in store.activeStays"
          :key="stay.id"
          class="stay-card">

        <div>
          <strong>
            {{
              vehicleFor(stay)
                  ?.plateNumber.value ?? '—'
            }}
          </strong>

          <p>
            {{
              store.spotById(
                  stay.parkingSpotId
              )?.code ?? '—'
            }}
            ·
            {{
              formatDate(
                  entryMovement(stay)
                      ?.occurredAt
              )
            }}
          </p>
        </div>

        <pv-button
            :label="t('access-control.stays.reassign')"
            severity="secondary"
            outlined
            size="small"
            @click="openReassign(stay)"/>
      </article>
    </div>
  </section>

  <pv-dialog
      v-model:visible="dialogVisible"
      modal
      :header="t('access-control.stays.reassign-title')"
      :style="{width: '440px'}">

    <div class="form-field">
      <label
          for="new-parking-spot"
          class="form-label">
        {{ t('access-control.fields.parking-spot') }}
      </label>

      <pv-select
          input-id="new-parking-spot"
          v-model="selectedSpotId"
          :options="spotOptions"
          option-label="label"
          option-value="value"/>
    </div>

    <template #footer>
      <pv-button
          :label="t('common.cancel')"
          severity="secondary"
          outlined
          @click="dialogVisible = false"/>

      <pv-button
          :label="t('access-control.stays.reassign')"
          :loading="loading"
          :disabled="!selectedSpotId"
          @click="performReassign"/>
    </template>
  </pv-dialog>
</template>

<style scoped>
.stay-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stay-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 14px 16px;
  border: 1px solid var(--ep-border);
  border-radius: 10px;
}

.stay-card p {
  margin: 4px 0 0;
  color: var(--ep-text-secondary);
  font-size: 13px;
}
</style>