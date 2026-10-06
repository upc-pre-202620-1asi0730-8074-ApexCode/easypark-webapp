import {defineStore} from "pinia";
import {computed, ref} from "vue";

import {MonitoringAlertsApi} from "../infrastructure/monitoring-alerts-api.js";
import {AlertAssembler} from "../infrastructure/alert.assembler.js";
import {AlertRuleAssembler} from "../infrastructure/alert-rule.assembler.js";

import {Alert} from "../domain/model/alert.entity.js";
import {AlertStatus} from "../domain/model/alert-status.js";
import {MonitoringContext} from "../domain/model/monitoring-context.js";

import {FacilityAssembler} from "../../parking-management/infrastructure/facility.assembler.js";
import {SpotAssembler} from "../../parking-management/infrastructure/spot.assembler.js";
import {AccessMovementAssembler} from "../../access-control/infrastructure/access-movement.assembler.js";
import {ParkingStayAssembler} from "../../access-control/infrastructure/parking-stay.assembler.js";

const monitoringAlertsApi = new MonitoringAlertsApi();

function outcome(success, reason) {
    return reason ? {success, reason} : {success};
}

function isToday(value) {
    if (!value) return false;

    const date = new Date(value);
    const now = new Date();

    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );
}

function sortByNewestFirst(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
}

/**
 * Origen de una alerta: la permanencia, el movimiento o el propio estacionamiento.
 * Dos evaluaciones de la misma fuente no deben crear dos alertas.
 */
function sourceKeyOf({parkingFacilityId, parkingStayId, accessMovementId}) {
    return parkingStayId ?? accessMovementId ?? parkingFacilityId;
}

const useMonitoringAlertsStore = defineStore('monitoring-alerts', () => {
    const facilities = ref([]);
    const currentFacility = ref(null);

    const alerts = ref([]);
    const alertRules = ref([]);
    const spots = ref([]);
    const stays = ref([]);
    const movements = ref([]);

    const facilitiesLoaded = ref(false);
    const monitoringDataLoaded = ref(false);
    const errors = ref([]);

    const activeAlerts = computed(
        () => alerts.value.filter(alert => alert.isActive)
    );

    const resolvedToday = computed(
        () => alerts.value.filter(
            alert =>
                alert.status === AlertStatus.RESOLVED &&
                isToday(alert.resolvedAt)
        )
    );

    const avgResolutionMinutes = computed(() => {
        const durations = resolvedToday.value
            .map(alert => alert.resolutionMinutes)
            .filter(value => value !== null);

        if (!durations.length) return 0;

        return Math.round(
            durations.reduce(
                (total, value) => total + value,
                0
            ) / durations.length
        );
    });

    async function fetchFacilities(operatorProfileId) {
        facilitiesLoaded.value = false;

        try {
            const response =
                await monitoringAlertsApi
                    .getFacilitiesByOperatorProfileId(
                        operatorProfileId
                    );

            facilities.value =
                FacilityAssembler
                    .toEntitiesFromResponse(response);

            errors.value = [];
        } catch (error) {
            facilities.value = [];
            errors.value.push(error);
        } finally {
            facilitiesLoaded.value = true;
        }
    }

    async function selectFacility(facilityId) {
        currentFacility.value =
            facilities.value.find(
                facility => facility.id === facilityId
            ) ?? null;

        alerts.value = [];
        alertRules.value = [];
        spots.value = [];
        stays.value = [];
        movements.value = [];

        if (!currentFacility.value) {
            monitoringDataLoaded.value = true;
            return;
        }

        monitoringDataLoaded.value = false;

        try {
            const [
                spotsResponse,
                alertsResponse,
                rulesResponse,
                staysResponse,
                movementsResponse
            ] = await Promise.all([
                monitoringAlertsApi
                    .getSpotsByFacilityId(facilityId),

                monitoringAlertsApi
                    .getAlertsByFacilityId(facilityId),

                monitoringAlertsApi
                    .getAlertRulesByFacilityId(facilityId),

                monitoringAlertsApi
                    .getParkingStays(),

                monitoringAlertsApi
                    .getAccessMovementsByFacilityId(
                        facilityId
                    )
            ]);

            spots.value =
                SpotAssembler
                    .toEntitiesFromResponse(spotsResponse);

            alertRules.value =
                AlertRuleAssembler
                    .toEntitiesFromResponse(rulesResponse);

            movements.value =
                AccessMovementAssembler
                    .toEntitiesFromResponse(movementsResponse);

            const facilitySpotIds =
                new Set(
                    spots.value.map(spot => spot.id)
                );

            stays.value =
                ParkingStayAssembler
                    .toEntitiesFromResponse(staysResponse)
                    .filter(
                        stay =>
                            facilitySpotIds.has(
                                stay.parkingSpotId
                            )
                    );

            alerts.value =
                AlertAssembler
                    .toEntitiesFromResponse(alertsResponse)
                    .sort(sortByNewestFirst);

            errors.value = [];

            await evaluateRules();
        } catch (error) {
            errors.value.push(error);
        } finally {
            monitoringDataLoaded.value = true;
        }
    }

    /**
     * Evaluación al momento de cargar: compara lo observado contra las reglas
     * habilitadas y crea las alertas que aún no existen. Es idempotente: nunca
     * duplica una alerta ya registrada para la misma fuente y tipo.
     */
    async function evaluateRules() {
        if (!currentFacility.value) return;

        const context =
            new MonitoringContext({
                parkingFacilityId:
                    currentFacility.value.id,
                spots: spots.value,
                stays: stays.value,
                movements: movements.value
            });

        const created = [];

        try {
            for (const rule of alertRules.value) {
                const breaches = rule.evaluate(context);

                for (const breach of breaches) {
                    const candidate = {
                        parkingFacilityId:
                            currentFacility.value.id,
                        parkingStayId:
                            breach.parkingStayId,
                        accessMovementId:
                            breach.accessMovementId
                    };

                    if (hasAlertFor(rule, candidate)) continue;

                    const response =
                        await monitoringAlertsApi.createAlert(
                            AlertAssembler
                                .toResourceFromEntity(
                                    new Alert({
                                        ...candidate,
                                        type: rule.type,
                                        severity:
                                        rule.severity,
                                        contextValue:
                                        breach.contextValue,
                                        createdAt:
                                        new Date().toISOString()
                                    })
                                )
                        );

                    created.push(
                        AlertAssembler
                            .toEntityFromResource(
                                response.data
                            )
                    );
                }
            }
        } catch (error) {
            errors.value.push(error);
        }

        if (!created.length) return;

        alerts.value = [
            ...created,
            ...alerts.value
        ].sort(sortByNewestFirst);
    }

    function hasAlertFor(rule, candidate) {
        const key = sourceKeyOf(candidate);

        return alerts.value.some(
            alert =>
                alert.type === rule.type &&
                sourceKeyOf(alert) === key
        );
    }

    async function resolveAlert(command) {
        const alert = alerts.value.find(
            item => item.id === command.alertId
        );

        if (!alert) {
            return outcome(false, 'failed');
        }

        const previous = {
            status: alert.status,
            resolvedAt: alert.resolvedAt,
            resolvedBy: alert.resolvedBy,
            note: alert.note
        };

        if (!alert.resolve(command.operatorId, command.note)) {
            return outcome(false, 'already-resolved');
        }

        try {
            await monitoringAlertsApi.updateAlert(
                alert.id,
                AlertAssembler.toResourceFromEntity(alert)
            );

            errors.value = [];

            return outcome(true);
        } catch (error) {
            Object.assign(alert, previous);

            errors.value.push(error);

            return outcome(false, 'failed');
        }
    }

    function clear() {
        facilities.value = [];
        currentFacility.value = null;
        alerts.value = [];
        alertRules.value = [];
        spots.value = [];
        stays.value = [];
        movements.value = [];
        facilitiesLoaded.value = false;
        monitoringDataLoaded.value = false;
        errors.value = [];
    }

    return {
        facilities,
        currentFacility,
        alerts,
        alertRules,
        spots,
        stays,
        movements,
        facilitiesLoaded,
        monitoringDataLoaded,
        errors,
        activeAlerts,
        resolvedToday,
        avgResolutionMinutes,
        fetchFacilities,
        selectFacility,
        resolveAlert,
        clear
    };
});

export default useMonitoringAlertsStore;
