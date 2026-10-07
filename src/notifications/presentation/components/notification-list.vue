<script setup>
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";

import useNotificationsStore from "../../application/notifications.store.js";
import {MarkNotificationReadCommand} from "../../domain/model/mark-notification-read.command.js";
import {
  NOTIFICATION_TONE_BY_TYPE,
  NotificationType
} from "../../domain/model/notification-type.js";

defineProps({
  title: {
    type: String,
    required: true
  },
  notifications: {
    type: Array,
    required: true
  }
});

const NOTIFICATION_ICON_BY_TYPE = Object.freeze({
  [NotificationType.TIME_REMAINING]: 'pi-clock',
  [NotificationType.STAY_EXPIRED]: 'pi-exclamation-circle',

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

function toneOf(notification) {
  const type = typeOf(notification);

  return type
      ? NOTIFICATION_TONE_BY_TYPE[type] ?? 'info'
      : 'info';
}

function iconOf(notification) {
  const type = typeOf(notification);

  return type
    ? NOTIFICATION_ICON_BY_TYPE[type] ?? 'pi-bell'
    : 'pi-bell';
}

/**
 * The mockup renders every row time as "6:15 PM" in a Spanish interface, but
 * `toLocaleTimeString('es', …)` yields "6:15 p. m.". The parts are taken
 * locale-aware and only the day period is normalized, so es and en both land
 * on the shape the mockup shows.
 */
function formatTime(value) {
  if (!value) return '—';

  const parts = new Intl.DateTimeFormat(
      locale.value,
      {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }
  ).formatToParts(new Date(value));

  const partOf = type =>
    parts.find(part => part.type === type)?.value ?? '';

  const dayPeriod = partOf('dayPeriod')
    .replace(/[.\s]/g, '')
    .toUpperCase();

  return `${partOf('hour')}:${partOf('minute')} ${dayPeriod}`;
}

/**
 * The mockup has no visible status pill or type badge, but a screen reader
 * cannot perceive the unread state from the title weight alone: type, status
 * and channel are announced as one hidden line instead.
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
            class="notification-item__icon"
            :class="`notification-item__icon--${toneOf(notification)}`"
            aria-hidden="true">
          <i :class="iconOf(notification)"/>
        </span>

        <div class="notification-item__body">
          <p class="notification-item__title">
            {{ notification.title }}
          </p>

          <p class="notification-item__message">
            {{ notification.message }}
          </p>
        </div>

        <time
            class="notification-item__time"
            :datetime="notification.createdAt">
          {{ formatTime(notification.createdAt) }}
        </time>

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
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--ep-border);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ep-text-tertiary);
}

.notification-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.notification-item {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: start;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid var(--ep-border);
}

.notification-item:last-child {
  border-bottom: none;
  padding-bottom: 4px;
}

.notification-item--unread {
  cursor: pointer;
}

.notification-item__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  font-size: 16px;
}

.notification-item__icon--info {
  color: var(--ep-primary);
  background: var(--ep-primary-soft);
}

.notification-item__icon--success {
  color: var(--ep-success-text);
  background: var(--ep-success-bg);
}

.notification-item__icon--warning {
  color: var(--ep-warning-text);
  background: var(--ep-warning-bg);
}

.notification-item__body {
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

.notification-item__time {
  font-size: 12px;
  color: var(--ep-text-secondary);
  white-space: nowrap;
}

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
