<script setup>
import {
  computed,
  reactive,
  ref
} from "vue";

import {
  useRoute,
  useRouter
} from "vue-router";

import {useI18n} from "vue-i18n";

import useIamStore from "../../application/iam.store.js";

import {SignInCommand} from "../../domain/model/sign-in.command.js";

import AuthenticationCard from "../components/authentication-card.vue";

const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const {t} =
    useI18n();

const route =
    useRoute();

const router =
    useRouter();

const store =
    useIamStore();

const form = reactive({
  email:
      typeof route.query.email ===
      'string'
          ? route.query.email
          : '',

  password:
      '',

  remember:
      false
});

const submitted =
    ref(false);

const loading =
    ref(false);

const failureReason =
    ref(null);

const justRegistered =
    computed(
        () =>
            route.query.registered ===
            'true' &&
            !failureReason.value
    );

const emailError =
    computed(() => {
      if (!form.email.trim()) {
        return t(
            'iam.validation.email-required'
        );
      }

      if (
          !emailPattern.test(
              form.email.trim()
          )
      ) {
        return t(
            'iam.validation.email-invalid'
        );
      }

      return null;
    });

const passwordError =
    computed(
        () =>
            form.password
                ? null
                : t(
                    'iam.validation.password-required'
                )
    );

async function performSignIn() {
  submitted.value = true;
  failureReason.value = null;

  if (
      emailError.value ||
      passwordError.value
  ) {
    return;
  }

  loading.value = true;

  const signInCommand =
      new SignInCommand({
        email:
        form.email,

        password:
        form.password
      });

  const result =
      await store.signIn(
          signInCommand,
          form.remember,
          router,
          route.query.redirect
      );

  loading.value = false;

  if (!result.success) {
    failureReason.value =
        result.reason;

    form.password = '';

    submitted.value = false;
  }
}
</script>

<template>
  <authentication-card
      :title="t('iam.sign-in.title')"
      :subtitle="t('iam.sign-in.subtitle')">

    <pv-message
        v-if="justRegistered"
        severity="success"
        class="mb-4"
        role="status">

      {{ t('iam.sign-in.registered') }}
    </pv-message>

    <pv-message
        v-if="failureReason"
        severity="error"
        class="mb-4"
        role="alert">

      {{
        t(
            `iam.sign-in.errors.${failureReason}`
        )
      }}
    </pv-message>

    <form
        novalidate
        @submit.prevent="performSignIn">

      <div class="form-field">
        <label
            for="email"
            class="form-label">

          {{ t('iam.fields.email') }}
        </label>

        <pv-input-text
            id="email"
            v-model="form.email"
            type="email"
            autocomplete="email"
            :placeholder="
              t(
                  'iam.fields.email-placeholder'
              )
            "
            :invalid="
              submitted &&
              !!emailError
            "
            :aria-describedby="
              submitted &&
              emailError
                ? 'email-error'
                : undefined
            "/>

        <small
            v-if="
              submitted &&
              emailError
            "
            id="email-error"
            class="form-error">

          <i
              class="pi pi-exclamation-circle"
              aria-hidden="true">
          </i>

          {{ emailError }}
        </small>
      </div>

      <div class="form-field">
        <label
            for="password"
            class="form-label">

          {{ t('iam.fields.password') }}
        </label>

        <pv-password
            input-id="password"
            v-model="form.password"
            :feedback="false"
            toggle-mask
            fluid
            :invalid="
              submitted &&
              !!passwordError
            "
            :input-props="{
              autocomplete:
                'current-password',

              'aria-describedby':
                submitted &&
                passwordError
                  ? 'password-error'
                  : undefined
            }"/>

        <small
            v-if="
              submitted &&
              passwordError
            "
            id="password-error"
            class="form-error">

          <i
              class="pi pi-exclamation-circle"
              aria-hidden="true">
          </i>

          {{ passwordError }}
        </small>
      </div>

      <div class="sign-in__options">
        <div class="sign-in__remember">
          <pv-checkbox
              v-model="form.remember"
              input-id="remember"
              binary/>

          <label for="remember">
            {{ t('iam.sign-in.remember') }}
          </label>
        </div>
      </div>

      <pv-button
          type="submit"
          :label="t('iam.sign-in.submit')"
          icon="pi pi-sign-in"
          :loading="loading"
          fluid/>
    </form>

    <div
        class="sign-in__divider"
        aria-hidden="true">

      <span class="sign-in__divider-line"></span>

      <span>
        {{ t('iam.sign-in.divider') }}
      </span>

      <span class="sign-in__divider-line"></span>
    </div>

    <p class="sign-in__footer">
      {{ t('iam.sign-in.no-account') }}

      <router-link
          :to="{
            name:
              'iam-sign-up'
          }">

        {{
          t(
              'iam.sign-in.sign-up-link'
          )
        }}
      </router-link>
    </p>
  </authentication-card>
</template>

<style scoped>
.sign-in__options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 20px;
}

.sign-in__remember {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ep-text-secondary);
  font-size: 13px;
}

.sign-in__divider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 24px 0 16px;
  color: var(--ep-text-tertiary);
  font-size: 12px;
}

.sign-in__divider-line {
  flex: 1;
  height: 1px;
  background: var(--ep-border);
}

.sign-in__footer {
  margin: 0;
  text-align: center;
  font-size: 13px;
  color: var(--ep-text-secondary);
}

.sign-in__footer a {
  font-weight: 700;
  text-decoration: none;
}
</style>