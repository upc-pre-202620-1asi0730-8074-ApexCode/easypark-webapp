import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import i18n from "./i18n.js";
import PrimeVue from 'primevue/config';
import Material from '@primeuix/themes/material';
import {definePreset} from "@primeuix/themes";
import 'primeflex/primeflex.css';
import 'primeicons/primeicons.css';
import Tooltip from 'primevue/tooltip';
import {
    Avatar,
    Button,
    Card,
    Checkbox,
    Column,
    ConfirmationService,
    ConfirmDialog,
    DataTable,
    Dialog,
    DialogService,
    Divider,
    Drawer,
    FloatLabel,
    IconField,
    InputIcon,
    InputNumber,
    InputText,
    Menu,
    Message,
    Password,
    RadioButton,
    Select,
    SelectButton,
    Tag,
    Textarea,
    Toast,
    ToastService,
    Toolbar
} from "primevue";
import router from "./router.js";
import pinia from "./pinia.js";

const easyParkPreset = definePreset(Material, {
    semantic: {
        primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
            950: '#172554'
        },
        colorScheme: {
            light: {
                primary: {
                    color: '{primary.600}',
                    contrastColor: '#ffffff',
                    hoverColor: '{primary.700}',
                    activeColor: '{primary.800}'
                }
            }
        },
        formField: {
            borderRadius: '8px'
        },
        content: {
            borderRadius: '10px'
        },
        overlay: {
            select: { borderRadius: '8px' },
            popover: { borderRadius: '10px' },
            modal: { borderRadius: '14px' }
        }
    }
});

const primeUiLicenseKey = import.meta.env.VITE_PRIME_UI_LICENSE_KEY;

createApp(App)
    .use(i18n)
    .use(PrimeVue, { theme: { preset: easyParkPreset, options: { darkModeSelector: '.easypark-dark' } }, ripple: true, license: primeUiLicenseKey })
    .use(ConfirmationService)
    .use(DialogService)
    .use(ToastService)
    .component('pv-avatar',         Avatar)
    .component('pv-button',         Button)
    .component('pv-card',           Card)
    .component('pv-checkbox',       Checkbox)
    .component('pv-column',         Column)
    .component('pv-confirm-dialog', ConfirmDialog)
    .component('pv-data-table',     DataTable)
    .component('pv-dialog',         Dialog)
    .component('pv-divider',        Divider)
    .component('pv-drawer',         Drawer)
    .component('pv-float-label',    FloatLabel)
    .component('pv-icon-field',     IconField)
    .component('pv-input-icon',     InputIcon)
    .component('pv-input-number',   InputNumber)
    .component('pv-input-text',     InputText)
    .component('pv-menu',           Menu)
    .component('pv-message',        Message)
    .component('pv-password',       Password)
    .component('pv-radio-button',   RadioButton)
    .component('pv-select',         Select)
    .component('pv-select-button',  SelectButton)
    .component('pv-tag',            Tag)
    .component('pv-textarea',       Textarea)
    .component('pv-toast',          Toast)
    .component('pv-toolbar',        Toolbar)
    .directive('tooltip',           Tooltip)
    .use(pinia)
    .use(router)
    .mount('#app')
