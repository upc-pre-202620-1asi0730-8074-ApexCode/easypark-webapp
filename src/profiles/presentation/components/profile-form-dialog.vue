<script setup>
import {computed, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";
import useProfilesStore from "../../application/profiles.store.js";
import {CreateProfileCommand} from "../../domain/model/create-profile.command.js";
import {UpdateProfileCommand} from "../../domain/model/update-profile.command.js";

const phonePattern = /^\+?[0-9][0-9\s-]{6,18}[0-9]$/;

const props = defineProps({
  userAccountId: { type: Number, required: true },
  isOperator: { type: Boolean, default: false }
});
const visible = defineModel('visible', { type: Boolean, default: false });

const { t } = useI18n();
const toast = useToast();
const store = useProfilesStore();

const form = reactive({ firstName: '', lastName: '', phone: '', companyName: '', jobTitle: '' });
const submitted = ref(false);
const loading = ref(false);
const failed = ref(false);

const isEditing = computed(() => store.currentProfile !== null);

const requiredError = (value) => value.trim() ? null : t('profiles.validation.required');
const errorsByField = computed(() => ({
  firstName: requiredError(form.firstName),
  lastName: requiredError(form.lastName),
  phone: !form.phone.trim() ? t('profiles.validation.required')
      : phonePattern.test(form.phone.trim()) ? null : t('profiles.validation.phone-invalid'),
  companyName: props.isOperator ? requiredError(form.companyName) : null,
  jobTitle: props.isOperator ? requiredError(form.jobTitle) : null
}));
const hasErrors = computed(() => Object.values(errorsByField.value).some(Boolean));

watch(visible, (isVisible) => {
  if (!isVisible) return;
  const profile = store.currentProfile;
  Object.assign(form, {
    firstName: profile?.firstName ?? '',
    lastName: profile?.lastName ?? '',
    phone: profile?.phone ?? '',
    companyName: profile?.companyName ?? '',
    jobTitle: profile?.jobTitle ?? ''
  });
  submitted.value = false;
  failed.value = false;
});

async function performSave() {
  submitted.value = true;
  failed.value = false;
  if (hasErrors.value) return;
  loading.value = true;
  const result = isEditing.value
      ? await store.updateProfile(new UpdateProfileCommand(form))
      : await store.createProfile(new CreateProfileCommand({ ...form, userAccountId: props.userAccountId }), props.isOperator);
  loading.value = false;
  if (!result.success) {
    failed.value = true;
    return;
  }
  toast.add({ severity: 'success', summary: t(isEditing.value ? 'profiles.form.updated' : 'profiles.form.created'), life: 4000 });
  visible.value = false;
}
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="t(isEditing ? 'profiles.form.edit-title' : 'profiles.form.create-title')"
             :style="{ width: '560px' }" :breakpoints="{ '640px': '92vw' }">
    <pv-message v-if="failed" severity="error" class="mb-4" role="alert">{{ t('profiles.form.failed') }}</pv-message>
    <form id="profile-form" novalidate @submit.prevent="performSave">
      <div class="form-grid">
        <div class="form-field">
          <label for="first-name" class="form-label">{{ t('profiles.fields.first-name') }}</label>
          <pv-input-text id="first-name" v-model="form.firstName" maxlength="50" autocomplete="given-name"
                         :invalid="submitted && !!errorsByField.firstName"/>
          <small v-if="submitted && errorsByField.firstName" class="form-error">
            <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ errorsByField.firstName }}
          </small>
        </div>
        <div class="form-field">
          <label for="last-name" class="form-label">{{ t('profiles.fields.last-name') }}</label>
          <pv-input-text id="last-name" v-model="form.lastName" maxlength="80" autocomplete="family-name"
                         :invalid="submitted && !!errorsByField.lastName"/>
          <small v-if="submitted && errorsByField.lastName" class="form-error">
            <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ errorsByField.lastName }}
          </small>
        </div>
      </div>
      <div class="form-field">
        <label for="phone" class="form-label">{{ t('profiles.fields.phone') }}</label>
        <pv-input-text id="phone" v-model="form.phone" type="tel" maxlength="20" autocomplete="tel"
                       placeholder="+51 987 654 321" :invalid="submitted && !!errorsByField.phone"/>
        <small v-if="submitted && errorsByField.phone" class="form-error">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ errorsByField.phone }}
        </small>
      </div>
      <div v-if="isOperator" class="form-grid">
        <div class="form-field">
          <label for="company-name" class="form-label">{{ t('profiles.fields.company-name') }}</label>
          <pv-input-text id="company-name" v-model="form.companyName" maxlength="120" autocomplete="organization"
                         :invalid="submitted && !!errorsByField.companyName"/>
          <small v-if="submitted && errorsByField.companyName" class="form-error">
            <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ errorsByField.companyName }}
          </small>
        </div>
        <div class="form-field">
          <label for="job-title" class="form-label">{{ t('profiles.fields.job-title') }}</label>
          <pv-input-text id="job-title" v-model="form.jobTitle" maxlength="80" autocomplete="organization-title"
                         :invalid="submitted && !!errorsByField.jobTitle"/>
          <small v-if="submitted && errorsByField.jobTitle" class="form-error">
            <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ errorsByField.jobTitle }}
          </small>
        </div>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" severity="secondary" outlined @click="visible = false"/>
      <pv-button type="submit" form="profile-form" :label="t('common.save')" :loading="loading"/>
    </template>
  </pv-dialog>
</template>
