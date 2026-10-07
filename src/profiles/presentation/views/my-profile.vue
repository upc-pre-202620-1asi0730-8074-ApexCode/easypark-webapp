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
      <pv-button :label="t('iam.account.sign-out')" severity="secondary" outlined @click="iamStore.signOut(router)"/>
    </div>

    <div v-if="!store.profileLoaded" class="panel" aria-busy="true">
      <p class="empty-state">{{ t('profiles.my-profile.loading') }}</p>
    </div>

    <template v-else>
      <section class="panel identity" :aria-label="t('profiles.my-profile.identity')">
        <img v-if="profile?.photoUrl" :src="profile.photoUrl" alt="" class="identity__avatar"/>
        <span v-else class="identity__avatar" aria-hidden="true">{{ initials }}</span>
        <div class="identity__text">
          <p class="identity__name">{{ displayName }}</p>
          <span class="status-badge status-badge--info">{{ roleLabel }}</span>
        </div>
      </section>

      <section class="panel" aria-labelledby="personal-information-title">
        <h2 id="personal-information-title" class="panel-title mb-4">{{ t('profiles.my-profile.personal-information') }}</h2>
        <dl v-if="profile" class="information-grid">
          <div v-for="row in personalInformation" :key="row.label" class="information-grid__item">
            <dt>{{ t(row.label) }}</dt>
            <dd>{{ row.value }}</dd>
          </div>
        </dl>
        <div v-else class="profile-empty">
          <p class="empty-state">{{ t('profiles.my-profile.empty') }}</p>
          <pv-button :label="t('profiles.my-profile.complete')" @click="profileDialogVisible = true"/>
        </div>
      </section>

      <div class="panel panel-actions">
        <pv-button :label="t('iam.change-password.title')" severity="secondary" outlined @click="passwordDialogVisible = true"/>
        <pv-button v-if="profile" :label="t('profiles.my-profile.edit')" @click="profileDialogVisible = true"/>
      </div>

      <vehicle-list v-if="profile && store.isDriverProfile"/>
    </template>
  </section>

  <profile-form-dialog v-model:visible="profileDialogVisible" :user-account-id="iamStore.currentUserId"
                       :is-operator="iamStore.isOperator"/>
  <change-password-dialog v-model:visible="passwordDialogVisible"/>
</template>

<style scoped>
.identity {
  display: flex;
  align-items: center;
  gap: 20px;
}

.identity__avatar {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: 999px;
  background: #c7d2fe;
  color: #3730a3;
  font-size: 20px;
  font-weight: 700;
  object-fit: cover;
}

.identity__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
}

.identity__name {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--ep-text);
}

.information-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 20px;
  margin: 0;
}

.information-grid__item {
  padding: 12px 0 16px;
  border-bottom: 1px solid var(--ep-border);
}

.information-grid__item:nth-last-child(-n + 2) {
  border-bottom: 0;
}

.information-grid dt {
  margin-bottom: 4px;
  color: var(--ep-text-secondary);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.information-grid dd {
  margin: 0;
  color: var(--ep-text);
  font-size: 14px;
}

.profile-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding-bottom: 8px;
}

@media (max-width: 767px) {
  .information-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .information-grid__item:nth-last-child(2) {
    border-bottom: 1px solid var(--ep-border);
  }

  .panel-actions {
    justify-content: stretch;
  }

  .panel-actions > * {
    flex: 1;
  }
}
</style>
