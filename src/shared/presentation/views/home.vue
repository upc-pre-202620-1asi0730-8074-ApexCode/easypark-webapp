<script setup>
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('home.title') }}</h1>
        <p class="page-subtitle">{{ t('home.content') }}</p>
      </div>
    </div>
  </section>
</template>
