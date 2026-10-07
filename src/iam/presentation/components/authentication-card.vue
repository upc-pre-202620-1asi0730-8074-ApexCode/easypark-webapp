<script setup>
import {useI18n} from "vue-i18n";
import LanguageSwitcher from "../../../shared/presentation/components/language-switcher.vue";

defineProps({
  title: {type: String, required: true},
  subtitle: {type: String, required: true}
});

const {t} = useI18n();

const features = [
  {key: 'find', icon: 'pi pi-map-marker'},
  {key: 'control', icon: 'pi pi-arrow-right-arrow-left'},
  {key: 'insight', icon: 'pi pi-chart-bar'}
];
</script>

<template>
  <div class="authentication-page">
    <aside class="authentication-brand">
      <span class="authentication-brand__logo">
        <span
            class="authentication-brand__mark"
            aria-hidden="true">
        </span>

        <span>EasyPark</span>
      </span>

      <div class="authentication-brand__pitch">
        <p class="authentication-brand__eyebrow">
          {{ t('iam.brand.eyebrow') }}
        </p>

        <p class="authentication-brand__tagline">
          {{ t('iam.brand.tagline') }}
        </p>

        <ul class="authentication-brand__features">
          <li
              v-for="feature in features"
              :key="feature.key"
              class="authentication-brand__feature">

            <span
                class="authentication-brand__icon"
                aria-hidden="true">

              <i :class="feature.icon"></i>
            </span>

            <span class="authentication-brand__feature-text">
              <strong>
                {{
                  t(
                      `iam.brand.features.${feature.key}.title`
                  )
                }}
              </strong>

              <span>
                {{
                  t(
                      `iam.brand.features.${feature.key}.description`
                  )
                }}
              </span>
            </span>
          </li>
        </ul>
      </div>

      <p class="authentication-brand__footer">
        © 2026 EasyPark
      </p>
    </aside>

    <main class="authentication-main">
      <div class="authentication-main__top">
        <span class="brand authentication-main__brand">
          <span
              class="brand-mark"
              aria-hidden="true">
          </span>

          <span>EasyPark</span>
        </span>

        <language-switcher/>
      </div>

      <section
          class="authentication-card"
          aria-labelledby="authentication-title">

        <header class="authentication-card__header">
          <h1
              id="authentication-title"
              class="authentication-card__title">

            {{ title }}
          </h1>

          <p class="authentication-card__subtitle">
            {{ subtitle }}
          </p>
        </header>

        <slot/>
      </section>
    </main>
  </div>
</template>

<style scoped>
.authentication-page {
  display: grid;
  grid-template-columns:
      minmax(0, 5fr)
      minmax(0, 6fr);
  min-height: 100vh;
  background: var(--ep-surface);
}

.authentication-brand {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 40px;
  padding: 48px 56px;
  background:
      linear-gradient(
          135deg,
          #2563eb,
          #1d4ed8
      );
  color: #ffffff;
}

.authentication-brand__logo {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: 700;
}

.authentication-brand__mark {
  display: inline-block;
  width: 28px;
  height: 28px;
  border-radius: 9px;
  background: #ffffff;
}

.authentication-brand__pitch {
  max-width: 460px;
}

.authentication-brand__eyebrow {
  margin: 0 0 14px;
  color: #bfdbfe;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.authentication-brand__tagline {
  margin: 0 0 36px;
  font-size: 34px;
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.authentication-brand__features {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.authentication-brand__feature {
  display: flex;
  align-items: flex-start;
  gap: 14px;
}

.authentication-brand__icon {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #3b82f6;
  color: #ffffff;
  font-size: 16px;
}

.authentication-brand__feature-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 13px;
  color: #dbeafe;
}

.authentication-brand__feature-text strong {
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
}

.authentication-brand__footer {
  margin: 0;
  color: #bfdbfe;
  font-size: 12px;
}

.authentication-main {
  display: flex;
  flex-direction: column;
  padding: 24px 40px 48px;
  background: var(--ep-page);
}

.authentication-main__top {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 16px;
}

.authentication-main__brand {
  display: none;
  margin-right: auto;
}

.authentication-card {
  width: 100%;
  max-width: 440px;
  margin: auto;
  padding: 40px;
  border: 1px solid var(--ep-border);
  border-radius: 16px;
  background: var(--ep-surface);
  box-shadow:
      var(
          --ep-shadow-md,
          0 16px 36px rgba(15, 23, 42, 0.12)
      );
}

.authentication-card__header {
  margin-bottom: 28px;
}

.authentication-card__title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--ep-text);
}

.authentication-card__subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ep-text-secondary);
}

@media (max-width: 1023px) {
  .authentication-page {
    grid-template-columns:
        minmax(0, 1fr);
  }

  .authentication-brand {
    display: none;
  }

  .authentication-main__brand {
    display: inline-flex;
  }
}

@media (max-width: 767px) {
  .authentication-main {
    padding: 16px 16px 32px;
  }

  .authentication-card {
    margin-top: 32px;
    padding: 28px 20px;
  }
}
</style>