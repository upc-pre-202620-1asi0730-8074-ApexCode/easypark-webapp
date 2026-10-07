import {defineStore} from "pinia";
import {computed, ref} from "vue";

import {AnalyticsReportingApi} from "../infrastructure/analytics-reporting-api.js";
import {ReportAssembler} from "../infrastructure/report.assembler.js";
import {OccupancyMetricAssembler} from "../infrastructure/occupancy-metric.assembler.js";

import {Report} from "../domain/model/report.entity.js";
import {OccupancyMetric} from "../domain/model/occupancy-metric.entity.js";
import {DashboardSnapshot} from "../domain/model/dashboard-snapshot.js";

import {FacilityAssembler} from "../../parking-management/infrastructure/facility.assembler.js";
import {SpotAssembler} from "../../parking-management/infrastructure/spot.assembler.js";

const analyticsReportingApi =
    new AnalyticsReportingApi();

function outcome(success, reason) {
    return reason
        ? {success, reason}
        : {success};
}

const useAnalyticsReportingStore =
    defineStore(
        'analytics-reporting',
        () => {
            const facilities = ref([]);
            const currentFacility = ref(null);

            const spots = ref([]);
            const movements = ref([]);
            const stays = ref([]);
            const vehicles = ref([]);

            const reports = ref([]);
            const metrics = ref([]);

            const currentReport = ref(null);

            const dashboard =
                ref(
                    new DashboardSnapshot()
                );

            const facilitiesLoaded =
                ref(false);

            const analyticsLoaded =
                ref(false);

            const errors = ref([]);

            const availableSpaces =
                computed(
                    () =>
                        spots.value.filter(
                            spot =>
                                spot.status ===
                                'AVAILABLE'
                        ).length
                );

            const occupiedSpaces =
                computed(
                    () =>
                        spots.value.filter(
                            spot =>
                                spot.status ===
                                'OCCUPIED'
                        ).length
                );

            const currentOccupancyRate =
                computed(() => {
                    const usable =
                        spots.value.filter(
                            spot =>
                                spot.status !==
                                'OUT_OF_SERVICE'
                        );

                    if (!usable.length) {
                        return 0;
                    }

                    return Number(
                        (
                            (
                                occupiedSpaces.value /
                                usable.length
                            ) * 100
                        ).toFixed(2)
                    );
                });

            const currentReportMovements =
                computed(() => {
                    if (!currentReport.value) {
                        return [];
                    }

                    return movementsForPeriod(
                        currentReport.value.period
                    );
                });

            const currentReportStays =
                computed(() => {
                    if (!currentReport.value) {
                        return [];
                    }

                    return staysForPeriod(
                        currentReport.value.period
                    );
                });

            async function fetchFacilities(
                operatorProfileId
            ) {
                facilitiesLoaded.value = false;

                try {
                    const response =
                        await analyticsReportingApi
                            .getFacilitiesByOperatorProfileId(
                                operatorProfileId
                            );

                    facilities.value =
                        FacilityAssembler
                            .toEntitiesFromResponse(
                                response
                            );

                    errors.value = [];
                } catch (error) {
                    facilities.value = [];
                    errors.value.push(error);
                } finally {
                    facilitiesLoaded.value = true;
                }
            }

            async function selectFacility(
                facilityId
            ) {
                currentFacility.value =
                    facilities.value.find(
                        facility =>
                            facility.id ===
                            facilityId
                    ) ?? null;

                spots.value = [];
                movements.value = [];
                stays.value = [];
                vehicles.value = [];
                reports.value = [];
                metrics.value = [];
                currentReport.value = null;

                if (!currentFacility.value) {
                    analyticsLoaded.value = true;
                    return;
                }

                analyticsLoaded.value = false;

                try {
                    const [
                        spotsResponse,
                        movementsResponse,
                        staysResponse,
                        vehiclesResponse,
                        reportsResponse,
                        metricsResponse
                    ] =
                        await Promise.all([
                            analyticsReportingApi
                                .getSpotsByFacilityId(
                                    facilityId
                                ),

                            analyticsReportingApi
                                .getMovementsByFacilityId(
                                    facilityId
                                ),

                            analyticsReportingApi
                                .getParkingStays(),

                            analyticsReportingApi
                                .getVehicles(),

                            analyticsReportingApi
                                .getReportsByFacilityId(
                                    facilityId
                                ),

                            analyticsReportingApi
                                .getMetricsByFacilityId(
                                    facilityId
                                )
                        ]);

                    spots.value =
                        SpotAssembler
                            .toEntitiesFromResponse(
                                spotsResponse
                            );

                    currentFacility.value.spots =
                        spots.value;

                    movements.value =
                        movementsResponse.data
                            .sort(
                                (a, b) =>
                                    new Date(
                                        b.occurredAt
                                    ) -
                                    new Date(
                                        a.occurredAt
                                    )
                            );

                    vehicles.value =
                        vehiclesResponse.data;

                    const spotIds =
                        new Set(
                            spots.value.map(
                                spot => spot.id
                            )
                        );

                    stays.value =
                        staysResponse.data.filter(
                            stay =>
                                spotIds.has(
                                    stay.parkingSpotId
                                )
                        );

                    reports.value =
                        ReportAssembler
                            .toEntitiesFromResponse(
                                reportsResponse
                            )
                            .sort(
                                (a, b) =>
                                    new Date(
                                        b.generatedAt
                                    ) -
                                    new Date(
                                        a.generatedAt
                                    )
                            );

                    metrics.value =
                        OccupancyMetricAssembler
                            .toEntitiesFromResponse(
                                metricsResponse
                            );

                    refreshDashboard();

                    errors.value = [];
                } catch (error) {
                    errors.value.push(error);
                } finally {
                    analyticsLoaded.value = true;
                }
            }

            async function generateReport(
                command
            ) {
                if (
                    !currentFacility.value ||
                    !command.period?.isValid
                ) {
                    return outcome(
                        false,
                        'invalid-period'
                    );
                }

                try {
                    const reportMovements =
                        movementsForPeriod(
                            command.period
                        );

                    const reportStays =
                        staysForPeriod(
                            command.period
                        );

                    const metric =
                        buildMetric(
                            command.period,
                            reportMovements,
                            reportStays
                        );

                    const metricResponse =
                        await analyticsReportingApi
                            .createOccupancyMetric(
                                OccupancyMetricAssembler
                                    .toResourceFromEntity(
                                        metric
                                    )
                            );

                    const createdMetric =
                        OccupancyMetricAssembler
                            .toEntityFromResource(
                                metricResponse.data
                            );

                    metrics.value.push(
                        createdMetric
                    );

                    const report =
                        new Report({
                            operatorId:
                            command.operatorId,
                            parkingFacilityId:
                            command
                                .parkingFacilityId,
                            type:
                            command.type,
                            period:
                            command.period
                        });

                    report.generate([
                        createdMetric
                    ]);

                    const reportResponse =
                        await analyticsReportingApi
                            .createReport(
                                ReportAssembler
                                    .toResourceFromEntity(
                                        report
                                    )
                            );

                    const createdReport =
                        ReportAssembler
                            .toEntityFromResource(
                                reportResponse.data
                            );

                    createdReport.generate([
                        createdMetric
                    ]);

                    currentReport.value =
                        createdReport;

                    reports.value.unshift(
                        createdReport
                    );

                    refreshDashboard();

                    errors.value = [];

                    return outcome(true);
                } catch (error) {
                    errors.value.push(error);

                    return outcome(
                        false,
                        'failed'
                    );
                }
            }

            function buildMetric(
                period,
                reportMovements,
                reportStays
            ) {
                const completedEntries =
                    reportMovements.filter(
                        movement =>
                            movement.movementType ===
                            'ENTRY' &&
                            movement.status ===
                            'COMPLETED'
                    ).length;

                const completedExits =
                    reportMovements.filter(
                        movement =>
                            movement.movementType ===
                            'EXIT' &&
                            movement.status ===
                            'COMPLETED'
                    ).length;

                const durations =
                    reportStays
                        .map(stay =>
                            stayDurationMinutes(
                                stay
                            )
                        )
                        .filter(
                            duration =>
                                duration !== null
                        );

                const averageStayMinutes =
                    durations.length
                        ? Math.round(
                            durations.reduce(
                                (total, duration) =>
                                    total +
                                    duration,
                                0
                            ) /
                            durations.length
                        )
                        : 0;

                const revenue =
                    reportStays.reduce(
                        (total, stay) => {
                            if (
                                !stay.exitMovementId
                            ) {
                                return total;
                            }

                            const exit =
                                movementById(
                                    stay.exitMovementId
                                );

                            if (
                                !exit ||
                                !period.contains(
                                    exit.occurredAt
                                )
                            ) {
                                return total;
                            }

                            return (
                                total +
                                Number(
                                    stay.chargedAmount ||
                                    0
                                )
                            );
                        },
                        0
                    );

                return new OccupancyMetric({
                    parkingFacilityId:
                    currentFacility.value.id,

                    measuredAt:
                        new Date().toISOString(),

                    occupancyRate:
                        calculateAverageOccupancy(
                            period,
                            reportStays
                        ),

                    entryCount:
                    completedEntries,

                    exitCount:
                    completedExits,

                    averageStayMinutes,

                    revenue:
                        Number(
                            revenue.toFixed(2)
                        ),

                    currency: 'PEN'
                });
            }

            function calculateAverageOccupancy(
                period,
                reportStays
            ) {
                const usableSpaces =
                    spots.value.filter(
                        spot =>
                            spot.status !==
                            'OUT_OF_SERVICE'
                    ).length;

                if (!usableSpaces) {
                    return 0;
                }

                const periodStart =
                    new Date(
                        period.start
                    ).getTime();

                const periodEnd =
                    new Date(
                        period.end
                    ).getTime();

                const periodMinutes =
                    Math.max(
                        1,
                        (
                            periodEnd -
                            periodStart
                        ) / 60000
                    );

                let occupiedMinutes = 0;

                for (
                    const stay
                    of reportStays
                    ) {
                    const entry =
                        movementById(
                            stay.entryMovementId
                        );

                    if (!entry) {
                        continue;
                    }

                    const exit =
                        stay.exitMovementId
                            ? movementById(
                                stay.exitMovementId
                            )
                            : null;

                    const stayStart =
                        new Date(
                            entry.occurredAt
                        ).getTime();

                    const stayEnd =
                        exit
                            ? new Date(
                                exit.occurredAt
                            ).getTime()
                            : Date.now();

                    const overlapStart =
                        Math.max(
                            periodStart,
                            stayStart
                        );

                    const overlapEnd =
                        Math.min(
                            periodEnd,
                            stayEnd
                        );

                    if (
                        overlapEnd <=
                        overlapStart
                    ) {
                        continue;
                    }

                    occupiedMinutes +=
                        (
                            overlapEnd -
                            overlapStart
                        ) / 60000;
                }

                return Number(
                    (
                        (
                            occupiedMinutes /
                            (
                                periodMinutes *
                                usableSpaces
                            )
                        ) * 100
                    ).toFixed(2)
                );
            }

            function movementsForPeriod(
                period
            ) {
                return movements.value.filter(
                    movement =>
                        period.contains(
                            movement.occurredAt
                        )
                );
            }

            function staysForPeriod(period) {
                return stays.value.filter(
                    stay => {
                        const entry =
                            movementById(
                                stay.entryMovementId
                            );

                        if (!entry) {
                            return false;
                        }

                        const exit =
                            stay.exitMovementId
                                ? movementById(
                                    stay.exitMovementId
                                )
                                : null;

                        const start =
                            new Date(
                                entry.occurredAt
                            );

                        const end =
                            exit
                                ? new Date(
                                    exit.occurredAt
                                )
                                : new Date();

                        return (
                            start <=
                            new Date(
                                period.end
                            ) &&
                            end >=
                            new Date(
                                period.start
                            )
                        );
                    }
                );
            }

            function stayDurationMinutes(
                stay
            ) {
                const entry =
                    movementById(
                        stay.entryMovementId
                    );

                if (!entry) {
                    return null;
                }

                const exit =
                    stay.exitMovementId
                        ? movementById(
                            stay.exitMovementId
                        )
                        : null;

                const start =
                    new Date(
                        entry.occurredAt
                    );

                const end =
                    exit
                        ? new Date(
                            exit.occurredAt
                        )
                        : new Date();

                return Math.max(
                    0,
                    Math.floor(
                        (
                            end -
                            start
                        ) / 60000
                    )
                );
            }

            function movementById(
                movementId
            ) {
                return movements.value.find(
                    movement =>
                        movement.id ===
                        movementId
                ) ?? null;
            }

            function plateForVehicle(
                vehicleId
            ) {
                return (
                    vehicles.value.find(
                        vehicle =>
                            vehicle.id ===
                            vehicleId
                    )?.plateNumber ??
                    '—'
                );
            }

            function plateForStay(stay) {
                const entry =
                    movementById(
                        stay.entryMovementId
                    );

                return entry
                    ? plateForVehicle(
                        entry.vehicleId
                    )
                    : '—';
            }

            function refreshDashboard() {
                const todayStart =
                    new Date();

                todayStart.setHours(
                    0,
                    0,
                    0,
                    0
                );

                const todayRevenue =
                    stays.value.reduce(
                        (total, stay) => {
                            if (
                                !stay.exitMovementId
                            ) {
                                return total;
                            }

                            const exit =
                                movementById(
                                    stay.exitMovementId
                                );

                            if (
                                !exit ||
                                new Date(
                                    exit.occurredAt
                                ) < todayStart
                            ) {
                                return total;
                            }

                            return (
                                total +
                                Number(
                                    stay.chargedAmount ||
                                    0
                                )
                            );
                        },
                        0
                    );

                dashboard.value.refresh({
                    totalOccupancy:
                    currentOccupancyRate.value,

                    revenueToday:
                        Number(
                            todayRevenue.toFixed(2)
                        ),

                    activeAlerts: 0,

                    availableSpaces:
                    availableSpaces.value,

                    zones:
                        currentFacility.value
                            ? [
                                {
                                    parkingFacilityId:
                                    currentFacility
                                        .value.id,
                                    name:
                                    currentFacility
                                        .value.name,
                                    occupancyRate:
                                    currentOccupancyRate
                                        .value,
                                    occupiedSpaces:
                                    occupiedSpaces
                                        .value,
                                    totalSpaces:
                                    spots.value.length
                                }
                            ]
                            : []
                });
            }

            function clear() {
                facilities.value = [];
                currentFacility.value = null;

                spots.value = [];
                movements.value = [];
                stays.value = [];
                vehicles.value = [];

                reports.value = [];
                metrics.value = [];

                currentReport.value = null;

                dashboard.value =
                    new DashboardSnapshot();

                facilitiesLoaded.value =
                    false;

                analyticsLoaded.value =
                    false;

                errors.value = [];
            }

            return {
                facilities,
                currentFacility,
                spots,
                movements,
                stays,
                vehicles,
                reports,
                metrics,
                currentReport,
                dashboard,
                facilitiesLoaded,
                analyticsLoaded,
                errors,
                availableSpaces,
                occupiedSpaces,
                currentOccupancyRate,
                currentReportMovements,
                currentReportStays,
                fetchFacilities,
                selectFacility,
                generateReport,
                movementById,
                plateForVehicle,
                plateForStay,
                stayDurationMinutes,
                clear
            };
        }
    );

export default useAnalyticsReportingStore;