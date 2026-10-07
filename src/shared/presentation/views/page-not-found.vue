<script setup>
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

const route = useRoute();
const unavailableRoute = route.path;
const { t } = useI18n();
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('page-not-found.title') }}</h1>
        <p class="page-subtitle">{{ t('page-not-found.content', { 'unavailable-route': unavailableRoute }) }}</p>
      </div>
    </div>
    <router-link :to="{ name: 'home' }" class="font-semibold">{{ t('page-not-found.go-home') }}</router-link>
  </section>
</template>
