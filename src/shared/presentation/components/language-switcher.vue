<script setup>
import {watch} from "vue";
import {useI18n} from "vue-i18n";

const { locale, availableLocales, t } = useI18n();

watch(locale, (value) => {
  document.documentElement.lang = value;
}, { immediate: true });
</script>

<template>
  <pv-select-button v-model="locale" :options="availableLocales" :allow-empty="false" size="small"
                    :aria-label="t('layout.language')">
    <template #option="slotProps">
      <span>{{ slotProps.option.toUpperCase() }}</span>
    </template>
  </pv-select-button>
</template>
