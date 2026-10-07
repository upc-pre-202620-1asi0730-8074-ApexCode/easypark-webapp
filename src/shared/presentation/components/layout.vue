<script setup>
import {computed, ref, watch} from "vue";
import {useRoute} from "vue-router";
import {useI18n} from "vue-i18n";
import LanguageSwitcher from "./language-switcher.vue";
import AuthenticationSection from "../../../iam/presentation/components/authentication-section.vue";
import useIamStore from "../../../iam/application/iam.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";

const {t} = useI18n();
const route = useRoute();
const iamStore = useIamStore();
const profilesStore = useProfilesStore();

const drawer = ref(false);

const myProfileRoute = {name: 'profiles-my-profile'};

const driverNavigation = [
  {label: 'profiles.navigation.profile', to: myProfileRoute},
  {label: 'reservations.navigation.reserve', to: {name: 'reservations-create'}},
  {label: 'reservations.navigation.my-reservations', to: {name: 'reservations-my'}},
  {label: 'notifications.navigation.inbox', to: {name: 'notifications-inbox'}}
];

const operatorNavigation = [
  {
    label: 'parking-management.navigation.facilities',
    to: {name: 'parking-management-facilities'}
  },
  {
    label: 'access-control.navigation.accesses',
    to: {name: 'access-control-accesses'}
  },
  {
    label: 'monitoring-alerts.navigation.alerts',
    to: {name: 'monitoring-alerts-alerts'},
    roles: ['OPERATOR_ADMIN']
  }
];

const accountItems = [
  {
    label: 'profiles.navigation.my-profile',
    icon: 'pi pi-user',
    route: myProfileRoute
  }
];

watch(
    () => iamStore.currentUserId,
    (userAccountId) => {
      if (userAccountId) {
        profilesStore.fetchProfile(
            userAccountId,
            iamStore.isOperator
        );
      } else {
        profilesStore.clear();
      }
    },
    {immediate: true}
);

const displayName = computed(
    () => profilesStore.currentProfile?.shortName ?? ''
);

const photoUrl = computed(
    () => profilesStore.currentProfile?.photoUrl ?? ''
);

const isStandalone = computed(
    () => route.matched.some(
        record => record.meta['standalone']
    )
);

const navigationItems = computed(() => {
  if (!iamStore.isSignedIn) return [];

  const items = iamStore.isOperator
      ? operatorNavigation
      : driverNavigation;

  return items.filter(
      item =>
          !item.roles ||
          item.roles.includes(iamStore.currentRole)
  );
});

function toggleDrawer() {
  drawer.value = !drawer.value;
}
</script>

<template>
  <pv-toast position="top-right"/>
  <pv-confirm-dialog/>

  <router-view v-if="isStandalone"/>

  <template v-else>
    <a
        class="skip-link"
        href="#main-content">
      {{ t('layout.skip-to-content') }}
    </a>

    <header class="app-header">
      <div class="app-header__start">
        <pv-button
            v-if="navigationItems.length"
            class="app-header__menu"
            icon="pi pi-bars"
            text
            rounded
            :aria-label="t('layout.open-menu')"
            @click="toggleDrawer"/>

        <router-link
            :to="{name: 'home'}"
            class="brand">
          <span
              class="brand-mark"
              aria-hidden="true">
          </span>

          <span>
            EasyPark
            <template v-if="iamStore.isOperator">
              · Admin
            </template>
          </span>
        </router-link>
      </div>

      <nav
          class="app-nav"
          :aria-label="t('layout.main-navigation')">

        <router-link
            v-for="item in navigationItems"
            :key="item.label"
            :to="item.to"
            class="app-nav__link"
            active-class="app-nav__link--active">
          {{ t(item.label) }}
        </router-link>
      </nav>

      <div class="app-header__end">
        <language-switcher/>

        <authentication-section
            :display-name="displayName"
            :photo-url="photoUrl"
            :items="accountItems"/>
      </div>
    </header>

    <pv-drawer
        v-model:visible="drawer"
        :header="t('layout.main-navigation')">

      <nav class="app-drawer-nav">
        <router-link
            v-for="item in navigationItems"
            :key="item.label"
            :to="item.to"
            class="app-drawer-nav__link"
            active-class="app-nav__link--active"
            @click="drawer = false">
          {{ t(item.label) }}
        </router-link>
      </nav>
    </pv-drawer>

    <main
        id="main-content"
        class="app-main">
      <router-view/>
    </main>
  </template>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 16px 40px;
  background: var(--ep-surface);
  border-bottom: 1px solid var(--ep-border);
}

.app-header__start,
.app-header__end {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 16px;
}

.app-header__end {
  justify-content: flex-end;
}

.app-header__menu {
  display: none;
}

.app-nav {
  display: flex;
  align-items: center;
  gap: 32px;
}

.app-nav__link {
  color: var(--ep-text-secondary);
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
}

.app-nav__link:hover {
  color: var(--ep-text);
}

.app-nav__link--active {
  color: var(--ep-primary);
  font-weight: 600;
}

.app-drawer-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.app-drawer-nav__link {
  padding: 12px 8px;
  border-radius: 8px;
  color: var(--ep-text);
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
}

.app-drawer-nav__link:hover {
  background: var(--ep-page);
}

@media (max-width: 1279px) {
  .app-header {
    padding: 16px 24px;
  }
}

@media (max-width: 767px) {
  .app-header {
    padding: 12px 16px;
    gap: 12px;
  }

  .app-header__menu {
    display: inline-flex;
  }

  .app-nav {
    display: none;
  }
}
</style>