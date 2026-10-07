<script setup>
import {computed, ref} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import useIamStore from "../../application/iam.store.js";
import ChangePasswordDialog from "./change-password-dialog.vue";

const props = defineProps({
  displayName: { type: String, default: '' },
  photoUrl: { type: String, default: '' },
  items: { type: Array, default: () => [] }
});

const { t } = useI18n();
const router = useRouter();
const store = useIamStore();
const menu = ref();
const passwordDialogVisible = ref(false);

const name = computed(() => props.displayName || store.currentEmail || '');
const roleLabel = computed(() => store.currentRole ? t(`iam.roles.${store.currentRole}`) : '');
const initials = computed(() => name.value
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join(''));

const menuItems = computed(() => [
  ...props.items.map(item => ({ label: t(item.label), icon: item.icon, command: () => router.push(item.route) })),
  { label: t('iam.change-password.title'), icon: 'pi pi-key', command: () => { passwordDialogVisible.value = true; } },
  { separator: true },
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
      <img v-if="photoUrl" :src="photoUrl" alt="" class="account__avatar"/>
      <span v-else class="account__avatar" aria-hidden="true">{{ initials }}</span>
      <span class="account__text">
        <span class="account__name">{{ name }}</span>
        <span class="account__role">{{ roleLabel }}</span>
      </span>
      <i class="pi pi-chevron-down account__chevron" aria-hidden="true"></i>
    </button>
    <pv-menu id="account-menu" ref="menu" :model="menuItems" popup/>
    <change-password-dialog v-model:visible="passwordDialogVisible"/>
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
  gap: 10px;
  padding: 4px 10px 4px 4px;
  border: 1px solid var(--ep-border);
  border-radius: 999px;
  background: var(--ep-surface);
  color: var(--ep-text);
  font: inherit;
  cursor: pointer;
}

.account__button:hover {
  background: var(--ep-page);
}

.account__avatar {
  display: inline-flex;
  flex-shrink: 0;
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

.account__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.25;
}

.account__name {
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.account__role {
  font-size: 11px;
  color: var(--ep-text-secondary);
  white-space: nowrap;
}

.account__chevron {
  font-size: 11px;
  color: var(--ep-text-tertiary);
}

@media (max-width: 767px) {
  .account__button {
    padding: 2px;
    border-color: transparent;
  }

  .account__text,
  .account__chevron {
    display: none;
  }
}
</style>
