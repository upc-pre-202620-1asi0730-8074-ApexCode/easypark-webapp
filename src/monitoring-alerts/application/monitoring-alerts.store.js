
import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import {MonitoringAlertsApi} from '../infrastructure/monitoring-alerts-api.js';
import {AlertAssembler} from '../infrastructure/alert.assembler.js';
import {AlertRuleAssembler} from '../infrastructure/alert-rule.assembler.js';
import {Alert} from '../domain/model/alert.entity.js';
import {AlertRule} from '../domain/model/alert-rule.entity.js';
import {AlertStatus} from '../domain/model/alert-status.js';
import {ALERT_SEVERITY_BY_TYPE, AlertType} from '../domain/model/alert-type.js';
import {MonitoringContext} from '../domain/model/monitoring-context.js';
import {MovementStatus} from '../../access-control/domain/model/movement-status.js';
import {FacilityAssembler} from '../../parking-management/infrastructure/facility.assembler.js';
import {SpotAssembler} from '../../parking-management/infrastructure/spot.assembler.js';
import {AccessMovementAssembler} from '../../access-control/infrastructure/access-movement.assembler.js';
import {ParkingStayAssembler} from '../../access-control/infrastructure/parking-stay.assembler.js';

const api = new MonitoringAlertsApi();
const sameId = (a, b) => a != null && b != null && String(a) === String(b);
const outcome = (success, reason) => reason ? {success, reason} : {success};
const dateValue = value => Number.isFinite(Date.parse(value)) ? Date.parse(value) : 0;
const severityOrder = {HIGH: 0, MEDIUM: 1, LOW: 2};
const statusOrder = {ACTIVE: 0, RESOLVED: 1, DISMISSED: 2};
const configurationTypes = new Set([
    AlertType.CAPACITY_NEAR_LIMIT,
    AlertType.CAPACITY_CRITICAL,
    AlertType.STAY_EXCEEDED
]);

function sortAlerts(a, b) {
    return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3) ||
        ((a.status === AlertStatus.ACTIVE && b.status === AlertStatus.ACTIVE)
            ? (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
            : 0) || dateValue(b.createdAt) - dateValue(a.createdAt);
}

function isToday(value) {
    if (!value) return false;
    const date = new Date(value);
    const today = new Date();
    return !Number.isNaN(date.getTime()) &&
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();
}

function sourceKeyOf(item) {
    const facility = `facility:${item.parkingFacilityId}`;
    if (item.parkingStayId != null) return `${facility}:stay:${item.parkingStayId}`;
    if (item.accessMovementId != null) return `${facility}:movement:${item.accessMovementId}`;
    return facility;
}

function accessEventTypeOf(movement) {
    if (movement.status === MovementStatus.UNDER_REVIEW &&
        movement.note === 'vehicle-under-review') return AlertType.UNRECOGNIZED_PLATE;
    if (movement.status === MovementStatus.REJECTED &&
        movement.note === 'no-active-reservation') return AlertType.ACCESS_WITHOUT_RESERVATION;
    return null;
}

const useMonitoringAlertsStore = defineStore('monitoring-alerts', () => {
    const facilities = ref([]);
    const selectedFacilityId = ref('all');
    const alerts = ref([]);
    const alertRules = ref([]);
    const spots = ref([]);
    const stays = ref([]);
    const movements = ref([]);
    const vehiclePlates = ref({});
    const facilitiesLoaded = ref(false);
    const monitoringDataLoaded = ref(false);
    const errors = ref([]);
    const pendingCreationKeys = new Set();
    const rearmedFacilityKeys = new Set();
    let facilitiesRequestId = 0;
    let monitoringRequestId = 0;

    const currentFacility = computed(() =>
        facilities.value.find(facility => sameId(facility.id, selectedFacilityId.value)) ?? null
    );
    const orderedAlerts = computed(() => [...alerts.value].sort(sortAlerts));
    const activeAlerts = computed(() => alerts.value.filter(alert => alert.isActive));
    const resolvedToday = computed(() => alerts.value.filter(alert =>
        alert.status === AlertStatus.RESOLVED && isToday(alert.resolvedAt)));
    const averageResolutionMinutes = computed(() => {
        const durations = resolvedToday.value.map(alert => alert.resolutionMinutes)
            .filter(value => value != null && Number.isFinite(value));
        if (!durations.length) return null;
        return Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length);
    });

    function clearMonitoring() {
        alerts.value = [];
        alertRules.value = [];
        spots.value = [];
        stays.value = [];
        movements.value = [];
        vehiclePlates.value = {};
    }

    function facilityOf(alert) {
        return facilities.value.find(facility => sameId(facility.id, alert.parkingFacilityId)) ?? null;
    }

    function stayOf(alert) {
        return stays.value.find(stay => sameId(stay.id, alert.parkingStayId)) ?? null;
    }

    function movementOf(alert) {
        const stay = stayOf(alert);
        const id = alert.accessMovementId ?? stay?.entryMovementId;
        return movements.value.find(movement => sameId(movement.id, id)) ?? null;
    }

    function spotOf(alert) {
        const stay = stayOf(alert);
        return spots.value.find(spot => sameId(spot.id, stay?.parkingSpotId)) ?? null;
    }

    function plateOf(alert) {
        const movement = movementOf(alert);
        return movement ? vehiclePlates.value[String(movement.vehicleId)] ?? null : null;
    }

    function ruleFor(facilityId, type) {
        return alertRules.value.find(rule => sameId(rule.parkingFacilityId, facilityId) &&
            rule.type === type) ?? null;
    }

    function hasAlertFor(type, candidate) {
        const matches = alerts.value.filter(alert =>
            alert.type === type && sourceKeyOf(alert) === sourceKeyOf(candidate));
        if (!matches.length) return false;
        if (candidate.parkingStayId != null || candidate.accessMovementId != null) return true;
        const key = `${type}:${sourceKeyOf(candidate)}`;
        return matches.some(alert => alert.isActive) || !rearmedFacilityKeys.has(key);
    }

    async function fetchFacilities(operatorProfileId) {
        const requestId = ++facilitiesRequestId;
        ++monitoringRequestId;
        facilitiesLoaded.value = false;
        monitoringDataLoaded.value = false;
        selectedFacilityId.value = 'all';
        facilities.value = [];
        errors.value = [];
        clearMonitoring();
        rearmedFacilityKeys.clear();
        if (operatorProfileId == null) {
            facilitiesLoaded.value = true;
            monitoringDataLoaded.value = true;
            return;
        }
        try {
            const response = await api.getFacilitiesByOperatorProfileId(operatorProfileId);
            if (requestId !== facilitiesRequestId) return;
            facilities.value = FacilityAssembler.toEntitiesFromResponse(response);
        } catch (error) {
            if (requestId === facilitiesRequestId) errors.value.push(error);
        } finally {
            if (requestId === facilitiesRequestId) facilitiesLoaded.value = true;
        }
    }

    async function loadVehiclePlates(requestId, loadedMovements) {
        const ids = [...new Set(loadedMovements.map(movement => movement.vehicleId)
            .filter(id => id != null).map(String))];
        const result = await Promise.allSettled(ids.map(id => api.getVehicleById(id)));
        if (requestId !== monitoringRequestId) return;
        const map = {};
        result.forEach((entry, index) => {
            if (entry.status === 'fulfilled' && entry.value?.data?.plateNumber) {
                map[ids[index]] = entry.value.data.plateNumber;
            }
        });
        vehiclePlates.value = map;
    }

    async function selectFacility(facilityId = 'all') {
        const requestId = ++monitoringRequestId;
        selectedFacilityId.value = facilityId == null ? 'all' : facilityId;
        clearMonitoring();
        errors.value = [];
        monitoringDataLoaded.value = false;
        const targets = selectedFacilityId.value === 'all'
            ? facilities.value
            : facilities.value.filter(facility => sameId(facility.id, selectedFacilityId.value));
        if (!targets.length) {
            monitoringDataLoaded.value = true;
            return;
        }
        try {
            const [staysResponse, ...data] = await Promise.all([
                api.getParkingStays(),
                ...targets.map(async facility => {
                    const id = facility.id;
                    const [spotsResponse, alertsResponse, rulesResponse, movementsResponse] =
                        await Promise.all([
                            api.getSpotsByFacilityId(id),
                            api.getAlertsByFacilityId(id),
                            api.getAlertRulesByFacilityId(id),
                            api.getAccessMovementsByFacilityId(id)
                        ]);
                    return {
                        facilityId: id,
                        spots: SpotAssembler.toEntitiesFromResponse(spotsResponse),
                        alerts: AlertAssembler.toEntitiesFromResponse(alertsResponse),
                        rules: AlertRuleAssembler.toEntitiesFromResponse(rulesResponse),
                        movements: AccessMovementAssembler.toEntitiesFromResponse(movementsResponse)
                    };
                })
            ]);
            if (requestId !== monitoringRequestId) return;
            const allStays = ParkingStayAssembler.toEntitiesFromResponse(staysResponse);
            const loadedSpots = data.flatMap(item => item.spots);
            const spotIds = new Set(loadedSpots.map(spot => String(spot.id)));
            stays.value = allStays.filter(stay => spotIds.has(String(stay.parkingSpotId)));
            spots.value = loadedSpots;
            alerts.value = data.flatMap(item => item.alerts);
            alertRules.value = data.flatMap(item => item.rules);
            movements.value = data.flatMap(item => item.movements);
            await loadVehiclePlates(requestId, movements.value);
            if (requestId !== monitoringRequestId) return;
            for (const facility of targets) {
                await evaluateRulesFor(facility.id, requestId);
                if (requestId !== monitoringRequestId) return;
                await reactToAccessEventsFor(facility.id, requestId);
            }
        } catch (error) {
            if (requestId === monitoringRequestId) {
                clearMonitoring();
                errors.value.push(error);
            }
        } finally {
            if (requestId === monitoringRequestId) monitoringDataLoaded.value = true;
        }
    }

    async function createAlert(candidate, requestId) {
        const key = `${candidate.type}:${sourceKeyOf(candidate)}`;
        if (requestId !== monitoringRequestId || hasAlertFor(candidate.type, candidate) ||
            pendingCreationKeys.has(key)) return false;
        pendingCreationKeys.add(key);
        try {
            const response = await api.createAlert(AlertAssembler.toResourceFromEntity(
                new Alert({...candidate, createdAt: new Date().toISOString()})));
            if (requestId !== monitoringRequestId) return false;
            const entity = AlertAssembler.toEntityFromResource(response.data);
            if (entity.id == null) throw new Error('Invalid alert identifier');
            if (!hasAlertFor(entity.type, entity)) alerts.value.push(entity);
            rearmedFacilityKeys.delete(key);
            return true;
        } catch (error) {
            if (requestId === monitoringRequestId) errors.value.push(error);
            return false;
        } finally {
            pendingCreationKeys.delete(key);
        }
    }

    async function evaluateRulesFor(facilityId, requestId = monitoringRequestId) {
        if (requestId !== monitoringRequestId) return;
        const facilitySpots = spots.value.filter(spot => sameId(spot.facilityId, facilityId));
        const spotIds = new Set(facilitySpots.map(spot => String(spot.id)));
        const context = new MonitoringContext({
            parkingFacilityId: facilityId,
            spots: facilitySpots,
            stays: stays.value.filter(stay => spotIds.has(String(stay.parkingSpotId))),
            movements: movements.value.filter(movement => sameId(movement.parkingFacilityId, facilityId))
        });
        const rules = alertRules.value.filter(rule => sameId(rule.parkingFacilityId, facilityId));
        const critical = rules.find(rule => rule.isEnabled &&
            rule.type === AlertType.CAPACITY_CRITICAL && Number.isFinite(Number(rule.threshold)) &&
            rule.threshold != null && Number(rule.threshold) >= 0 && Number(rule.threshold) <= 1);
        for (const rule of rules) {
            if (requestId !== monitoringRequestId) return;
            if (!configurationTypes.has(rule.type)) continue;
            const suppressed = rule.type === AlertType.CAPACITY_NEAR_LIMIT &&
                critical && context.totalSpots > 0 && context.occupancyRate >= Number(critical.threshold);
            const breaches = suppressed ? [] : rule.evaluate(context);
            if (!breaches.length && rule.type !== AlertType.STAY_EXCEEDED && rule.isEnabled) {
                rearmedFacilityKeys.add(`${rule.type}:facility:${facilityId}`);
            }
            for (const breach of breaches) {
                if (requestId !== monitoringRequestId) return;
                await createAlert({
                    parkingFacilityId: facilityId,
                    parkingStayId: breach.parkingStayId ?? null,
                    accessMovementId: breach.accessMovementId ?? null,
                    type: rule.type,
                    severity: rule.severity,
                    contextValue: breach.contextValue ?? null
                }, requestId);
            }
        }
    }

    async function reactToAccessEventsFor(facilityId, requestId = monitoringRequestId) {
        for (const movement of movements.value) {
            if (requestId !== monitoringRequestId) return;
            if (!sameId(movement.parkingFacilityId, facilityId) || movement.id == null) continue;
            const type = accessEventTypeOf(movement);
            if (!type) continue;
            await createAlert({
                parkingFacilityId: facilityId,
                parkingStayId: null,
                accessMovementId: movement.id,
                type,
                severity: ALERT_SEVERITY_BY_TYPE[type],
                contextValue: null
            }, requestId);
        }
    }

    async function fetchRulesFor(facilityId) {
        if (!facilities.value.some(facility => sameId(facility.id, facilityId))) return false;
        try {
            const response = await api.getAlertRulesByFacilityId(facilityId);
            const loaded = AlertRuleAssembler.toEntitiesFromResponse(response);
            alertRules.value = [
                ...alertRules.value.filter(rule => !sameId(rule.parkingFacilityId, facilityId)),
                ...loaded
            ];
            return true;
        } catch (error) {
            errors.value.push(error);
            return false;
        }
    }

    async function saveRule(facilityId, type, threshold, enabled) {
        if (!facilities.value.some(facility => sameId(facility.id, facilityId)) ||
            !configurationTypes.has(type)) return outcome(false, 'failed');
        const value = Number(threshold);
        const capacityRule = type !== AlertType.STAY_EXCEEDED;
        if (threshold == null || !Number.isFinite(value) || value < 0 ||
            (capacityRule && value > 1) || (!capacityRule && !Number.isInteger(value))) {
            return outcome(false, 'invalid-threshold');
        }
        if (!ruleFor(facilityId, type)) {
            const loaded = await fetchRulesFor(facilityId);
            if (!loaded) return outcome(false, 'failed');
        }
        const existing = ruleFor(facilityId, type);
        const next = new AlertRule({
            id: existing?.id ?? null,
            parkingFacilityId: facilityId,
            type,
            threshold: value,
            enabled: Boolean(enabled),
            severity: existing?.severity ?? ALERT_SEVERITY_BY_TYPE[type],
            updatedAt: new Date().toISOString()
        });
        try {
            const resource = AlertRuleAssembler.toResourceFromEntity(next);
            const response = existing
                ? await api.updateAlertRule(existing.id, resource)
                : await api.createAlertRule(resource);
            const saved = AlertRuleAssembler.toEntityFromResource(response.data);
            if (existing) {
                const index = alertRules.value.findIndex(rule => sameId(rule.id, existing.id));
                if (index >= 0) alertRules.value.splice(index, 1, saved);
            } else {
                alertRules.value.push(saved);
            }
            if (selectedFacilityId.value === 'all' || sameId(selectedFacilityId.value, facilityId)) {
                await evaluateRulesFor(facilityId);
            }
            return outcome(true);
        } catch (error) {
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function resolveAlert(command) {
        const alert = alerts.value.find(item => sameId(item.id, command.alertId));
        if (!alert) return outcome(false, 'failed');
        if (!alert.isActive) return outcome(false, 'already-resolved');
        const previous = {
            status: alert.status, resolvedAt: alert.resolvedAt,
            resolvedBy: alert.resolvedBy, note: alert.note
        };
        if (!alert.resolve(command.resolvedBy, command.note)) return outcome(false, 'already-resolved');
        try {
            await api.updateAlert(alert.id, AlertAssembler.toResourceFromEntity(alert));
            return outcome(true);
        } catch (error) {
            Object.assign(alert, previous);
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    function clear() {
        ++facilitiesRequestId;
        ++monitoringRequestId;
        facilities.value = [];
        selectedFacilityId.value = 'all';
        clearMonitoring();
        errors.value = [];
        rearmedFacilityKeys.clear();
        facilitiesLoaded.value = false;
        monitoringDataLoaded.value = false;
    }

    return {
        facilities, selectedFacilityId, currentFacility, alerts, alertRules,
        spots, stays, movements, vehiclePlates, facilitiesLoaded, monitoringDataLoaded,
        errors, orderedAlerts, activeAlerts, resolvedToday, averageResolutionMinutes,
        facilityOf, stayOf, movementOf, spotOf, plateOf, ruleFor,
        fetchFacilities, selectFacility, fetchRulesFor, saveRule, resolveAlert, clear
    };
});

export default useMonitoringAlertsStore;
