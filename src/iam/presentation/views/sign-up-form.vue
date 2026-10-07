<script setup>
import {computed, reactive, ref} from "vue";
import {useRouter} from "vue-router";
import {useI18n} from "vue-i18n";
import useIamStore from "../../application/iam.store.js";
import {SignUpCommand} from "../../domain/model/sign-up.command.js";
import {selfRegistrationRoles, UserRole} from "../../domain/model/user-role.js";
import AuthenticationCard from "../components/authentication-card.vue";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const minPasswordLength = 8;

const { t } = useI18n();
const router = useRouter();
const store = useIamStore();

const form = reactive({
  role: UserRole.DRIVER,
  email: '',
  password: '',
  confirmPassword: ''
});
const submitted = ref(false);
const loading = ref(false);
const failureReason = ref(null);

const roleOptions = computed(() => selfRegistrationRoles.map(role => ({ label: t(`iam.roles.${role}`), value: role })));

const emailError = computed(() => {
  if (!form.email.trim()) return t('iam.validation.email-required');
  if (!emailPattern.test(form.email.trim())) return t('iam.validation.email-invalid');
  if (failureReason.value === 'email-taken') return t('iam.sign-up.errors.email-taken');
  return null;
});
const passwordError = computed(() => {
  if (!form.password) return t('iam.validation.password-required');
  if (form.password.length < minPasswordLength) return t('iam.validation.password-length', { length: minPasswordLength });
  return null;
});
const confirmPasswordError = computed(() => form.confirmPassword === form.password ? null : t('iam.validation.password-mismatch'));

async function performSignUp() {
  submitted.value = true;
  failureReason.value = null;
  if (emailError.value || passwordError.value || confirmPasswordError.value) return;
  loading.value = true;
  const signUpCommand = new SignUpCommand({email: form.email, password: form.password, role: form.role});
  const result = await store.signUp(signUpCommand, router);
  loading.value = false;
  if (!result.success) failureReason.value = result.reason;
}

function clearEmailFailure() {
  if (failureReason.value === 'email-taken') failureReason.value = null;
}
</script>

<template>
  <authentication-card :title="t('iam.sign-up.title')" :subtitle="t('iam.sign-up.subtitle')">
    <pv-message v-if="failureReason === 'failed'" severity="error" class="mb-4" role="alert">
      {{ t('iam.sign-up.errors.failed') }}
    </pv-message>
    <form novalidate @submit.prevent="performSignUp">
      <div class="form-field">
        <span id="role-label" class="form-label">{{ t('iam.fields.role') }}</span>
        <pv-select-button v-model="form.role" :options="roleOptions" option-label="label" option-value="value"
                          :allow-empty="false" aria-labelledby="role-label" class="sign-up__roles"/>
      </div>
      <div class="form-field">
        <label for="email" class="form-label">{{ t('iam.fields.email') }}</label>
        <pv-input-text id="email" v-model="form.email" type="email" autocomplete="email"
                       :placeholder="t('iam.fields.email-placeholder')" @input="clearEmailFailure"
                       :invalid="submitted && !!emailError" :aria-describedby="submitted && emailError ? 'email-error' : undefined"/>
        <small v-if="submitted && emailError" id="email-error" class="form-error">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ emailError }}
        </small>
      </div>
      <div class="form-field">
        <label for="password" class="form-label">{{ t('iam.fields.password') }}</label>
        <pv-password input-id="password" v-model="form.password" :feedback="false" toggle-mask fluid
                     :invalid="submitted && !!passwordError"
                     :input-props="{ autocomplete: 'new-password', 'aria-describedby': submitted && passwordError ? 'password-error' : 'password-hint' }"/>
        <small v-if="submitted && passwordError" id="password-error" class="form-error">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ passwordError }}
        </small>
        <small v-else id="password-hint" class="sign-up__hint">{{ t('iam.validation.password-length', { length: minPasswordLength }) }}</small>
      </div>
      <div class="form-field">
        <label for="confirm-password" class="form-label">{{ t('iam.fields.confirm-password') }}</label>
        <pv-password input-id="confirm-password" v-model="form.confirmPassword" :feedback="false" toggle-mask fluid
                     :invalid="submitted && !!confirmPasswordError"
                     :input-props="{ autocomplete: 'new-password', 'aria-describedby': submitted && confirmPasswordError ? 'confirm-password-error' : undefined }"/>
        <small v-if="submitted && confirmPasswordError" id="confirm-password-error" class="form-error">
          <i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ confirmPasswordError }}
        </small>
      </div>
      <pv-button type="submit" :label="t('iam.sign-up.submit')" :loading="loading" fluid class="mt-2"/>
    </form>
    <p class="sign-up__footer">
      {{ t('iam.sign-up.has-account') }}
      <router-link :to="{ name: 'iam-sign-in' }">{{ t('iam.sign-up.sign-in-link') }}</router-link>
    </p>
  </authentication-card>
</template>

<style scoped>
.sign-up__roles {
  display: flex;
  width: 100%;
}

.sign-up__roles :deep(.p-togglebutton) {
  flex: 1;
}

.sign-up__hint {
  font-size: 12px;
  color: var(--ep-text-secondary);
}

.sign-up__footer {
  margin: 20px 0 0;
  text-align: center;
  font-size: 12px;
  color: var(--ep-text-secondary);
}

.sign-up__footer a {
  font-weight: 700;
  text-decoration: none;
}
</style>
