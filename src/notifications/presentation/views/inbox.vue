<script setup>
import {computed, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";

import useNotificationsStore from "../../application/notifications.store.js";
import useIamStore from "../../../iam/application/iam.store.js";

import {NotificationType} from "../../domain/model/notification-type.js";
import {notificationIcon, notificationTone} from "../notification-icons.js";

import NotificationList from "../components/notification-list.vue";

const {t, locale} = useI18n();
const toast = useToast();

const store = useNotificationsStore();
const iamStore = useIamStore();

const filter = ref('all');

const filterOptions = computed(() => [
  {label: t('notifications.filters.all'), value: 'all'},
  {label: t('notifications.filters.unread'), value: 'unread'}
]);

const legend = Object.values(NotificationType);

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

function matchesFilter(notification) {
  return filter.value === 'all' || notification.isUnread;
}

const todayNotifications = computed(
    () => store.todayNotifications.filter(matchesFilter)
);

const yesterdayNotifications = computed(
    () => store.yesterdayNotifications.filter(matchesFilter)
);

/**
 * Everything older than yesterday: the store only groups the last two days,
 * so without this group those notifications would never be listed.
 */
const earlierNotifications = computed(() => {
  const recent = new Set(
      [
        ...store.todayNotifications,
        ...store.yesterdayNotifications
      ].map(notification => notification.id)
  );

  return store.notifications.filter(
      notification =>
          !recent.has(notification.id) &&
          matchesFilter(notification)
  );
});

const hasVisibleNotifications = computed(
    () =>
        todayNotifications.value.length +
        yesterdayNotifications.value.length +
        earlierNotifications.value.length > 0
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

      <div class="page-actions">
        <pv-select-button
            v-model="filter"
            :options="filterOptions"
            option-label="label"
            option-value="value"
            :allow-empty="false"
            :aria-label="t('notifications.filters.label')"/>

        <pv-button
            :label="t('notifications.actions.markAllRead')"
            icon="pi pi-check"
            severity="secondary"
            outlined
            :disabled="!store.unreadCount"
            @click="markAllRead"/>
      </div>
    </div>

    <div class="split">
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

        <div
            v-else-if="!hasVisibleNotifications"
            class="empty">

          <span
              class="icon-chip icon-chip--lg icon-chip--muted"
              aria-hidden="true">
            <i class="pi pi-bell"></i>
          </span>

          <p class="empty__title">
            {{
              filter === 'unread' && store.notifications.length
                  ? t('notifications.empty-unread')
                  : t('notifications.empty')
            }}
          </p>
        </div>

        <template v-else>
          <notification-list
              v-if="todayNotifications.length"
              :title="t('notifications.groups.today')"
              :notifications="todayNotifications"/>

          <notification-list
              v-if="yesterdayNotifications.length"
              :title="t('notifications.groups.yesterday')"
              :notifications="yesterdayNotifications"/>

          <notification-list
              v-if="earlierNotifications.length"
              :title="t('notifications.groups.earlier')"
              :notifications="earlierNotifications"
              show-date/>
        </template>
      </div>

      <aside class="stack">
        <section
            class="panel"
            aria-labelledby="inbox-summary-title">

          <h2
              id="inbox-summary-title"
              class="panel-title inbox-aside__title">
            {{ t('notifications.summary.title') }}
          </h2>

          <dl class="inbox-summary">
            <div class="inbox-summary__item">
              <dt>{{ t('notifications.summary.unread') }}</dt>
              <dd class="inbox-summary__value--unread">{{ store.unreadCount }}</dd>
            </div>

            <div class="inbox-summary__item">
              <dt>{{ t('notifications.summary.total') }}</dt>
              <dd>{{ store.notifications.length }}</dd>
            </div>
          </dl>

          <p class="inbox-aside__hint">
            {{ t('notifications.summary.hint') }}
          </p>
        </section>

        <section
            class="panel"
            aria-labelledby="inbox-legend-title">

          <h2
              id="inbox-legend-title"
              class="panel-title inbox-aside__title">
            {{ t('notifications.legend.title') }}
          </h2>

          <ul class="inbox-legend">
            <li
                v-for="type in legend"
                :key="type"
                class="inbox-legend__item">

              <span
                  class="icon-chip icon-chip--sm"
                  :class="`icon-chip--${notificationTone(type)}`"
                  aria-hidden="true">
                <i :class="notificationIcon(type)"></i>
              </span>

              {{ t(`notifications.types.${type}`) }}
            </li>
          </ul>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.inbox-aside__title {
  margin-bottom: 16px;
}

.inbox-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.inbox-summary__item {
  padding: 14px;
  border-radius: 10px;
  background: var(--ep-page);
}

.inbox-summary dt {
  color: var(--ep-text-secondary);
  font-size: 12px;
  font-weight: 500;
}

.inbox-summary dd {
  margin: 4px 0 0;
  color: var(--ep-text);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.inbox-summary .inbox-summary__value--unread {
  color: var(--ep-primary);
}

.inbox-aside__hint {
  margin: 14px 0 0;
  color: var(--ep-text-tertiary);
  font-size: 12px;
}

.inbox-legend {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.inbox-legend__item {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--ep-text);
  font-size: 13px;
}
</style>