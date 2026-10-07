<script setup>
import {watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";

import useNotificationsStore from "../../application/notifications.store.js";
import useIamStore from "../../../iam/application/iam.store.js";

import NotificationList from "../components/notification-list.vue";

const {t, locale} = useI18n();
const toast = useToast();

const store = useNotificationsStore();
const iamStore = useIamStore();

watch(
    () => iamStore.currentUserId,
    async recipientId => {
      if (!recipientId) {
        store.clear();
        return;
      }

      await store.fetchNotifications(recipientId, locale.value);
      await store.reactToSourceEvents(recipientId, locale.value);
    },
    {
      immediate: true
    }
);

async function markAllRead() {
  const result = await store.markAllAsRead();

  if (!result.success) {
    toast.add({
      severity: 'error',
      summary: t(`notifications.errors.${result.reason}`),
      life: 4000
    });

    return;
  }

  toast.add({
    severity: 'success',
    summary: t('notifications.messages.allMarkedRead'),
    life: 4000
  });
}
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{ t('notifications.title') }}
        </h1>

        <p class="page-subtitle">
          {{ t('notifications.subtitle') }}
        </p>
      </div>

      <pv-button
          :label="t('notifications.actions.markAllRead')"
          severity="secondary"
          outlined
          :disabled="!store.unreadCount"
          @click="markAllRead"/>
    </div>

    <div
        class="panel"
        aria-live="polite">

      <p class="sr-only">
        {{ t('notifications.unreadCount', {count: store.unreadCount}) }}
      </p>

      <p
          v-if="!store.notificationsLoaded"
          class="empty-state">
        {{ t('notifications.loading') }}
      </p>

      <p
          v-else-if="!store.notifications.length"
          class="empty-state">
        {{ t('notifications.empty') }}
      </p>

      <template v-else>
        <notification-list
            v-if="store.todayNotifications.length"
            :title="t('notifications.groups.today')"
            :notifications="store.todayNotifications"/>

        <notification-list
            v-if="store.yesterdayNotifications.length"
            :title="t('notifications.groups.yesterday')"
            :notifications="store.yesterdayNotifications"/>

        <p
            v-if="
              !store.todayNotifications.length &&
              !store.yesterdayNotifications.length
            "
            class="empty-state">
          {{ t('notifications.empty') }}
        </p>
      </template>
    </div>
  </section>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
