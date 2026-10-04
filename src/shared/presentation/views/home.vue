<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <section class="pt-6 p-4 md:p-5">
    <div class="flex flex-column gap-3">
      <h1 class="text-4xl font-bold text-color">{{ t('home.title') }}</h1>
      <p class="m-0 line-height-3 text-color-secondary">{{ t('home.content') }}</p>
    </div>
  </section>
</template>
