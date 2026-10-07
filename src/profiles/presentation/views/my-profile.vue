<script setup>
import {computed, ref} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import useIamStore from "../../../iam/application/iam.store.js";
import useProfilesStore from "../../application/profiles.store.js";
import ChangePasswordDialog from "../../../iam/presentation/components/change-password-dialog.vue";
import ProfileFormDialog from "../components/profile-form-dialog.vue";
import VehicleList from "../components/vehicle-list.vue";

const { t, locale } = useI18n();
const router = useRouter();
const iamStore = useIamStore();
const store = useProfilesStore();

const profileDialogVisible = ref(false);
const passwordDialogVisible = ref(false);

const profile = computed(() => store.currentProfile);
const roleLabel = computed(() => t(`iam.roles.${iamStore.currentRole}`));
const displayName = computed(() => profile.value?.fullName || iamStore.currentEmail);
const initials = computed(() => (profile.value ? [profile.value.firstName, profile.value.lastName] : (iamStore.currentEmail ?? '').split(/[@.]+/))
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join(''));
const memberSince = computed(() => {
  if (!profile.value?.createdAt) return '—';
  const formatted = new Intl.DateTimeFormat(locale.value, { month: 'long', year: 'numeric' }).format(new Date(profile.value.createdAt));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
});
const personalInformation = computed(() => {
  if (!profile.value) return [];
  const rows = [
    { label: 'profiles.fields.first-name', value: profile.value.firstName },
    { label: 'profiles.fields.last-name', value: profile.value.lastName },
    { label: 'profiles.fields.email', value: iamStore.currentEmail },
    { label: 'profiles.fields.phone', value: profile.value.phone },
    { label: 'profiles.fields.role', value: roleLabel.value },
    { label: 'profiles.fields.member-since', value: memberSince.value }
  ];
  if (iamStore.isOperator) rows.push(
      { label: 'profiles.fields.company-name', value: profile.value.companyName || '—' },
      { label: 'profiles.fields.job-title', value: profile.value.jobTitle || '—' });
  return rows;
});
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('profiles.my-profile.title') }}</h1>
        <p class="page-subtitle">{{ t('profiles.my-profile.subtitle') }}</p>
      </div>
    </div>

    <div v-if="!store.profileLoaded" class="panel" aria-busy="true">
      <p class="empty-state">{{ t('profiles.my-profile.loading') }}</p>
    </div>

    <div v-else class="split split--aside">
      <section class="panel identity" :aria-label="t('profiles.my-profile.identity')">
        <img v-if="profile?.photoUrl" :src="profile.photoUrl" alt="" class="identity__avatar"/>
        <span v-else class="identity__avatar" aria-hidden="true">{{ initials }}</span>
        <p class="identity__name">{{ displayName }}</p>
        <p class="identity__email">{{ iamStore.currentEmail }}</p>
        <span class="status-badge status-badge--info">{{ roleLabel }}</span>

        <div class="identity__actions">
          <pv-button v-if="profile" :label="t('profiles.my-profile.edit')" icon="pi pi-pencil" fluid
                     @click="profileDialogVisible = true"/>
          <pv-button :label="t('iam.change-password.title')" icon="pi pi-key" severity="secondary" outlined fluid
                     @click="passwordDialogVisible = true"/>
          <pv-button :label="t('iam.account.sign-out')" icon="pi pi-sign-out" severity="danger" text fluid
                     @click="iamStore.signOut(router)"/>
        </div>
      </section>

      <div class="stack">
        <section class="panel" aria-labelledby="personal-information-title">
          <div class="panel-header">
            <div>
              <h2 id="personal-information-title" class="panel-title">{{ t('profiles.my-profile.personal-information') }}</h2>
              <p class="panel-description">{{ t('profiles.my-profile.personal-information-description') }}</p>
            </div>
          </div>
          <dl v-if="profile" class="detail-grid">
            <div v-for="row in personalInformation" :key="row.label">
              <dt>{{ t(row.label) }}</dt>
              <dd>{{ row.value }}</dd>
            </div>
          </dl>
          <div v-else class="empty">
            <span class="icon-chip icon-chip--lg icon-chip--muted" aria-hidden="true"><i class="pi pi-id-card"></i></span>
            <p class="empty__text">{{ t('profiles.my-profile.empty') }}</p>
            <pv-button class="empty__action" :label="t('profiles.my-profile.complete')" icon="pi pi-pencil"
                       @click="profileDialogVisible = true"/>
          </div>
        </section>

        <vehicle-list v-if="profile && store.isDriverProfile"/>
      </div>
    </div>
  </section>

  <profile-form-dialog v-model:visible="profileDialogVisible" :user-account-id="iamStore.currentUserId"
                       :is-operator="iamStore.isOperator"/>
  <change-password-dialog v-model:visible="passwordDialogVisible"/>
</template>

<style scoped>
.identity {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.identity__avatar {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 88px;
  height: 88px;
  margin-bottom: 8px;
  border-radius: 999px;
  background: #c7d2fe;
  color: #3730a3;
  font-size: 28px;
  font-weight: 700;
  object-fit: cover;
}

.identity__name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--ep-text);
  overflow-wrap: anywhere;
}

.identity__email {
  margin: -4px 0 4px;
  color: var(--ep-text-secondary);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.identity__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--ep-border);
}
</style>
