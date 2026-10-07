<script setup>
import {computed, reactive, ref, watch} from "vue";
import {useI18n} from "vue-i18n";
import {useToast} from "primevue/usetoast";
import useIamStore from "../../application/iam.store.js";
import {ChangePasswordCommand} from "../../domain/model/change-password.command.js";

const minPasswordLength = 8;

const visible = defineModel('visible', { type: Boolean, default: false });

const { t } = useI18n();
const toast = useToast();
const store = useIamStore();

const form = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' });
const submitted = ref(false);
const loading = ref(false);
const failureReason = ref(null);

const currentPasswordError = computed(() => {
  if (!form.currentPassword) return t('iam.validation.password-required');
  if (failureReason.value === 'wrong-current-password') return t('iam.change-password.errors.wrong-current-password');
  return null;
});
const newPasswordError = computed(() => {
  if (form.newPassword.length < minPasswordLength) return t('iam.validation.password-length', { length: minPasswordLength });
  if (form.newPassword === form.currentPassword) return t('iam.change-password.errors.same-password');
  return null;
});
const confirmPasswordError = computed(() => form.confirmPassword === form.newPassword ? null : t('iam.validation.password-mismatch'));

watch(visible, (isVisible) => {
  if (!isVisible) return;
  Object.assign(form, { currentPassword: '', newPassword: '', confirmPassword: '' });
  submitted.value = false;
  failureReason.value = null;
});

async function performChangePassword() {
  submitted.value = true;
  failureReason.value = null;
  if (currentPasswordError.value || newPasswordError.value || confirmPasswordError.value) return;
  loading.value = true;
  const result = await store.changePassword(new ChangePasswordCommand({
    currentPassword: form.currentPassword,
    newPassword: form.newPassword
  }));
  loading.value = false;
  if (result.success) {
    toast.add({ severity: 'success', summary: t('iam.change-password.success'), life: 4000 });
    visible.value = false;
    return;
  }
  failureReason.value = result.reason;
}
</script>

<template>
  <pv-dialog v-model:visible="visible" modal :header="t('iam.change-password.title')" :style="{ width: '440px' }"
             :breakpoints="{ '575px': '92vw' }">
    <pv-message v-if="failureReason && failureReason !== 'wrong-current-password'" severity="error" class="mb-4" role="alert">
      {{ t(`iam.change-password.errors.${failureReason}`) }}
    </pv-message>
    <form id="change-password-form" novalidate @submit.prevent="performChangePassword">
      <div class="form-field">
        <label for="current-password" class="form-label">{{ t('iam.change-password.current') }}</label>
        <pv-password input-id="current-password" v-model="form.currentPassword" :feedback="false" toggle-mask fluid
                     :invalid="submitted && !!currentPasswordError" :input-props="{ autocomplete: 'current-password' }"/>
        <small v-if="submitted && currentPasswordError" class="form-error">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ currentPasswordError }}
        </small>
      </div>
      <div class="form-field">
        <label for="new-password" class="form-label">{{ t('iam.change-password.new') }}</label>
        <pv-password input-id="new-password" v-model="form.newPassword" :feedback="false" toggle-mask fluid
                     :invalid="submitted && !!newPasswordError" :input-props="{ autocomplete: 'new-password' }"/>
        <small v-if="submitted && newPasswordError" class="form-error">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ newPasswordError }}
        </small>
      </div>
      <div class="form-field">
        <label for="confirm-new-password" class="form-label">{{ t('iam.fields.confirm-password') }}</label>
        <pv-password input-id="confirm-new-password" v-model="form.confirmPassword" :feedback="false" toggle-mask fluid
                     :invalid="submitted && !!confirmPasswordError" :input-props="{ autocomplete: 'new-password' }"/>
        <small v-if="submitted && confirmPasswordError" class="form-error">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ confirmPasswordError }}
        </small>
      </div>
    </form>
    <template #footer>
      <pv-button :label="t('common.cancel')" severity="secondary" outlined @click="visible = false"/>
      <pv-button type="submit" form="change-password-form" :label="t('common.save')" :loading="loading"/>
    </template>
  </pv-dialog>
</template>
