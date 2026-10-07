<script setup>
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";

import useNotificationsStore from "../../application/notifications.store.js";
import {MarkNotificationReadCommand} from "../../domain/model/mark-notification-read.command.js";
import {
  formatNotificationTime,
  notificationIcon,
  notificationTone
} from "../notification-icons.js";

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  notifications: {
    type: Array,
    required: true
  },
  /**
   * Groups older than yesterday mix several days, so each row also shows its date.
   */
  showDate: {
    type: Boolean,
    default: false
  }
});

const {t, locale} = useI18n();
const toast = useToast();
const store = useNotificationsStore();

function templateOf(notification) {
  return store.templates.find(
      template =>
          template.id === notification.notificationTemplateId
  ) ?? null;
}

function typeOf(notification) {
  return templateOf(notification)?.type ?? null;
}

function formatTime(value) {
  const time = formatNotificationTime(value, locale.value);

  if (!props.showDate || !value) return time;

  const date = new Intl.DateTimeFormat(
      locale.value,
      {day: 'numeric', month: 'short'}
  ).format(new Date(value));

  return `${date} · ${time}`;
}

/**
 * A screen reader cannot perceive the unread state from the title weight and
 * the dot alone: type, status and channel are announced as one hidden line.
 */
function metadataOf(notification) {
  const type = typeOf(notification);

  return [
    type ? t(`notifications.types.${type}`) : null,
    t(`notifications.status.${notification.status}`),
    t(`notifications.channels.${notification.channel}`)
  ].filter(Boolean).join(' · ');
}

async function onItemClick(notification) {
  // Unread flips to READ synchronously before the request settles, so a
  // second click (or Enter) on the same row never fires the transition again.
  if (!notification.isUnread) return;

  const result =
      await store.markNotificationRead(
          new MarkNotificationReadCommand({
            notificationId: notification.id
          })
      );

  if (!result.success) {
    toast.add({
      severity: 'error',
      summary: t(
          `notifications.errors.${result.reason}`
      ),
      life: 4000
    });

    return;
  }

  toast.add({
    severity: 'success',
    summary: t('notifications.messages.markedRead'),
    life: 4000
  });
}
</script>

<template>
  <section class="notification-group">
    <h2 class="notification-group__title">
      {{ title }}
    </h2>

    <ul class="notification-list">
      <li
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="
            notification.isUnread
              ? 'notification-item--unread'
              : 'notification-item--read'
          "
          :tabindex="notification.isUnread ? 0 : null"
          @click="onItemClick(notification)"
          @keydown.enter.prevent="onItemClick(notification)">

        <span
            class="icon-chip"
            :class="`icon-chip--${notificationTone(typeOf(notification))}`"
            aria-hidden="true">
          <i :class="notificationIcon(typeOf(notification))"></i>
        </span>

        <div class="notification-item__body">
          <p class="notification-item__title">
            {{ notification.title }}
          </p>

          <p class="notification-item__message">
            {{ notification.message }}
          </p>
        </div>

        <div class="notification-item__meta">
          <time
              class="notification-item__time"
              :datetime="notification.createdAt">
            {{ formatTime(notification.createdAt) }}
          </time>

          <span
              v-if="notification.isUnread"
              class="status-dot status-dot--info"
              aria-hidden="true">
          </span>
        </div>

        <span class="sr-only">
          {{ metadataOf(notification) }}
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.notification-group + .notification-group {
  margin-top: 24px;
}

.notification-group__title {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ep-text-tertiary);
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 16px;
  border: 1px solid var(--ep-border);
  border-radius: 12px;
  background: var(--ep-surface);
}

.notification-item--unread {
  border-color: #bfdbfe;
  background: var(--ep-primary-tint);
  cursor: pointer;
}

.notification-item--unread:hover {
  border-color: var(--ep-primary);
}

.notification-item__body {
  flex: 1;
  min-width: 0;
}

.notification-item__title {
  margin: 0;
  font-size: 14px;
  color: var(--ep-text);
}

.notification-item--unread .notification-item__title {
  font-weight: 700;
}

.notification-item--read .notification-item__title {
  font-weight: 500;
  color: var(--ep-text-secondary);
}

.notification-item__message {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--ep-text-secondary);
}

.notification-item__meta {
  display: flex;
  flex-shrink: 0;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.notification-item__time {
  font-size: 12px;
  color: var(--ep-text-secondary);
  white-space: nowrap;
}
</style>