<script setup>
import {computed, ref} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import useIamStore from "../../application/iam.store.js";

const props = defineProps({
  displayName: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  items: { type: Array, default: () => [] }
});

const { t } = useI18n();
const router = useRouter();
const store = useIamStore();
const menu = ref();

const name = computed(() => props.displayName || store.currentEmail || '');
const initials = computed(() => name.value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join(''));

const menuItems = computed(() => [
  ...props.items.map(item => ({ label: t(item.label), icon: item.icon, command: () => router.push(item.route) })),
  ...(props.items.length ? [{ separator: true }] : []),
  { label: t('iam.account.sign-out'), icon: 'pi pi-sign-out', command: () => store.signOut(router) }
]);

function toggleMenu(event) {
  menu.value.toggle(event);
}
</script>

<template>
  <div v-if="store.isSignedIn" class="account">
    <button type="button" class="account__button" aria-haspopup="true" aria-controls="account-menu"
            :aria-label="t('iam.account.menu', { name })" @click="toggleMenu">
      <span class="account__name">{{ name }}</span>
      <img v-if="photoUrl" :src="photoUrl" alt="" class="account__avatar"/>
      <span v-else class="account__avatar" aria-hidden="true">{{ initials }}</span>
    </button>
    <pv-menu id="account-menu" ref="menu" :model="menuItems" popup/>
  </div>
  <div v-else class="account account--anonymous">
    <pv-button :label="t('iam.account.sign-in')" severity="secondary" outlined size="small"
               @click="router.push({ name: 'iam-sign-in' })"/>
    <pv-button :label="t('iam.account.sign-up')" size="small" @click="router.push({ name: 'iam-sign-up' })"/>
  </div>
</template>

<style scoped>
.account {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account__button {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 2px 2px 2px 8px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--ep-text);
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.account__button:hover {
  background: var(--ep-page);
}

.account__avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #c7d2fe;
  color: #3730a3;
  font-size: 12px;
  font-weight: 700;
  object-fit: cover;
}

@media (max-width: 767px) {
  .account__name {
    display: none;
  }
}
</style>
