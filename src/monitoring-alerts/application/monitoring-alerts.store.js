import {defineStore} from "pinia";
import {computed, ref} from "vue";

import {MonitoringAlertsApi} from "../infrastructure/monitoring-alerts-api.js";
import {AlertAssembler} from "../infrastructure/alert.assembler.js";
import {AlertRuleAssembler} from "../infrastructure/alert-rule.assembler.js";

import {Alert} from "../domain/model/alert.entity.js";
import {AlertStatus} from "../domain/model/alert-status.js";
import {ALERT_SEVERITY_BY_TYPE, AlertType} from "../domain/model/alert-type.js";
import {MonitoringContext} from "../domain/model/monitoring-context.js";

import {MovementStatus} from "../../access-control/domain/model/movement-status.js";

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
 * Source of an alert: a parking stay, an access movement, or the facility itself.
 * Two evaluations of the same source must never create two alerts.
 *
 * The key is namespaced because parkingStayId, accessMovementId and
 * parkingFacilityId belong to three different id spaces: the raw ids collide
 * (a movement id of 1 equals a facility id of 1), so an unprefixed key would
 * make a movement-based alert match a facility-based seed alert and silently
 * skip its creation. Stay wins over movement, preserving the original
 * precedence of `stay ?? movement ?? facility`.
 *
 * @returns {string} a single, total, kind-prefixed key.
 */
function sourceKeyOf({parkingFacilityId, parkingStayId, accessMovementId}) {
    if (parkingStayId != null) return `stay:${parkingStayId}`;
    if (accessMovementId != null) return `movement:${accessMovementId}`;

    return `facility:${parkingFacilityId}`;
}

/**
 * Alert type implied by an access movement that Access Control has already
 * classified. Returns null when the movement is not classified as a problem.
 */
function accessEventTypeOf(movement) {
    if (movement.status === MovementStatus.UNDER_REVIEW) {
        return AlertType.UNRECOGNIZED_PLATE;
    }

    if (
        movement.status === MovementStatus.REJECTED &&
        // 'no-active-reservation' is Access Control's published rejection
        // reason and has no exported constant: keep it in sync manually.
        movement.note === 'no-active-reservation'
    ) {
        return AlertType.ACCESS_WITHOUT_RESERVATION;
    }

    return null;
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
            await reactToAccessEvents();
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

                    if (hasAlertFor(rule.type, candidate)) continue;

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

    function hasAlertFor(type, candidate) {
        const key = sourceKeyOf(candidate);

        return alerts.value.some(
            alert =>
                alert.type === type &&
                sourceKeyOf(alert) === key
        );
    }

    /**
     * Monitoring does not validate plates or reservations: Access Control
     * classifies the movement and Monitoring reacts to that classification.
     * No threshold is involved, so these alerts come from a rule-free path.
     * Idempotent by (type, sourceKey): an already registered alert for the
     * same access movement is never created twice.
     */
    async function reactToAccessEvents() {
        if (!currentFacility.value) return;

        const created = [];

        try {
            for (const movement of movements.value) {
                const type = accessEventTypeOf(movement);

                if (!type) continue;

                const candidate = {
                    parkingFacilityId:
                        currentFacility.value.id,
                    parkingStayId: null,
                    accessMovementId: movement.id
                };

                if (hasAlertFor(type, candidate)) continue;

                const response =
                    await monitoringAlertsApi.createAlert(
                        AlertAssembler
                            .toResourceFromEntity(
                                new Alert({
                                    ...candidate,
                                    type,
                                    severity:
                                    ALERT_SEVERITY_BY_TYPE[type],
                                    contextValue: null,
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
        } catch (error) {
            errors.value.push(error);
        }

        if (!created.length) return;

        alerts.value = [
            ...created,
            ...alerts.value
        ].sort(sortByNewestFirst);
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

        if (!alert.resolve(command.resolvedBy, command.note)) {
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
        fetchFacilities,
        selectFacility,
        resolveAlert,
        clear
    };
});

export default useMonitoringAlertsStore;
