<script setup>

import LanguageSwitcher from "./language-switcher.vue";
import {ref} from "vue";
import {useI18n} from "vue-i18n";
import FooterContent from "./footer-content.vue";
// To import when IAM is implemented:
// import AuthenticationSection from "../../../iam/presentation/components/authentication-section.vue";
const { t } = useI18n();

const drawer = ref(false);
const toggleDrawer = () => {
  /**
   * Toggles the state of the drawer between open and closed.
   */
  drawer.value = !drawer.value;
}
const items = [
  {label: 'option.home', to: '/home'},
  {label: 'option.about', to: '/about'},
  {label: 'option.categories', to: '/publishing/categories'},
  {label: 'option.tutorials', to: '/publishing/tutorials'}
];
</script>

<template>
  <pv-toast/>
  <pv-confirm-dialog/>
  <header class="absolute top-0 left-0 w-full">
    <pv-toolbar class="bg-primary">
      <template #start>
        <pv-button class="p-button-text" icon="pi pi-bars" @click="toggleDrawer"/>
        <h3>ACME Learning Center</h3>
      </template>
      <template #end>
        <div class="flex-column mr-3">
          <pv-button v-for="item in items" :key="item.label" as-child v-slot="slotProps">
            <router-link :to="item.to" :class="slotProps['class']">{{ t(item.label) }}</router-link>
          </pv-button>
        </div>
        <!-- To add when IAM is implemented -->
        <!--<authentication-section/>-->
        <language-switcher/>
      </template>
    </pv-toolbar>
    <pv-drawer v-model:visible="drawer"/>
  </header>
  <main class="mt-7">
    <router-view/>
  </main>
  <footer-content/>
</template>