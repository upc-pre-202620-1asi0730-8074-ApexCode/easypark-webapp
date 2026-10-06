<script setup>
import {computed, watch} from "vue";
import {useI18n} from "vue-i18n";

import useAnalyticsReportingStore from "../../application/analytics-reporting.store.js";
import useProfilesStore from "../../../profiles/application/profiles.store.js";

import {ReportType} from "../../domain/model/report-type.js";

import ReportFilters from "../components/report-filters.vue";
import ReportSummary from "../components/report-summary.vue";
import OccupancyReport from "../components/occupancy-report.vue";
import MovementReport from "../components/movement-report.vue";

const {t} = useI18n();

const store =
    useAnalyticsReportingStore();

const profilesStore =
    useProfilesStore();

const facilityOptions =
    computed(
        () =>
            store.facilities.map(
                facility => ({
                  label:
                  facility.name,
                  value:
                  facility.id
                })
            )
    );

const selectedFacilityId =
    computed({
      get() {
        return (
            store.currentFacility?.id ??
            null
        );
      },

      set(value) {
        store.selectFacility(value);
      }
    });

const showOccupancyReport =
    computed(
        () =>
            [
              ReportType.OCCUPANCY,
              ReportType.REVENUE
            ].includes(
                store.currentReport?.type
            )
    );

const showMovementReport =
    computed(
        () =>
            [
              ReportType.MOVEMENTS,
              ReportType.STAY_TIME
            ].includes(
                store.currentReport?.type
            )
    );

watch(
    () =>
        profilesStore.currentProfile?.id,

    async profileId => {
      if (!profileId) {
        return;
      }

      await store.fetchFacilities(
          profileId
      );

      if (store.facilities.length) {
        await store.selectFacility(
            store.facilities[0].id
        );
      }
    },

    {
      immediate: true
    }
);
</script>

<template>
  <section class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">
          {{
            t(
                'analytics-reporting.title'
            )
          }}
        </h1>

        <p class="page-subtitle">
          {{
            t(
                'analytics-reporting.subtitle'
            )
          }}
        </p>
      </div>

      <pv-select
          v-if="store.facilities.length"
          v-model="selectedFacilityId"
          :options="facilityOptions"
          option-label="label"
          option-value="value"/>
    </div>

    <div
        v-if="!store.facilitiesLoaded"
        class="panel">

      <p class="empty-state">
        {{
          t(
              'analytics-reporting.loading'
          )
        }}
      </p>
    </div>

    <div
        v-else-if="
          !store.facilities.length
        "
        class="panel">

      <p class="empty-state">
        {{
          t(
              'analytics-reporting.no-facilities'
          )
        }}
      </p>
    </div>

    <template v-else>
      <div
          v-if="!store.analyticsLoaded"
          class="panel">

        <p class="empty-state">
          {{
            t(
                'analytics-reporting.loading'
            )
          }}
        </p>
      </div>

      <template v-else>
        <report-filters/>

        <template
            v-if="store.currentReport">

          <report-summary/>

          <occupancy-report
              v-if="showOccupancyReport"/>

          <movement-report
              v-if="showMovementReport"/>
        </template>

        <section
            v-else
            class="panel">

          <p class="empty-state">
            {{
              t(
                  'analytics-reporting.select-period'
              )
            }}
          </p>
        </section>
      </template>
    </template>
  </section>
</template>