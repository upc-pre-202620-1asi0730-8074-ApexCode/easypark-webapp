
import {BaseApi} from '../../shared/infrastructure/base-api.js';
import {BaseEndpoint} from '../../shared/infrastructure/base-endpoint.js';

export class MonitoringAlertsApi extends BaseApi {
    #alerts;
    #rules;
    #facilities;
    #spots;
    #stays;
    #movements;
    #vehicles;

    constructor() {
        super();
        this.#alerts = new BaseEndpoint(this, import.meta.env.VITE_ALERTS_ENDPOINT_PATH);
        this.#rules = new BaseEndpoint(this, import.meta.env.VITE_ALERT_RULES_ENDPOINT_PATH);
        this.#facilities = new BaseEndpoint(this, import.meta.env.VITE_FACILITIES_ENDPOINT_PATH);
        this.#spots = new BaseEndpoint(this, import.meta.env.VITE_PARKING_SPOTS_ENDPOINT_PATH);
        this.#stays = new BaseEndpoint(this, import.meta.env.VITE_PARKING_STAYS_ENDPOINT_PATH);
        this.#movements = new BaseEndpoint(this, import.meta.env.VITE_ACCESS_MOVEMENTS_ENDPOINT_PATH);
        this.#vehicles = new BaseEndpoint(this, import.meta.env.VITE_VEHICLES_ENDPOINT_PATH);
    }

    getFacilitiesByOperatorProfileId(operatorProfileId) {
        return this.#facilities.getAll({operatorProfileId});
    }

    getSpotsByFacilityId(facilityId) {
        return this.#spots.getAll({facilityId});
    }

    getParkingStays() {
        return this.#stays.getAll();
    }

    getAccessMovementsByFacilityId(parkingFacilityId) {
        return this.#movements.getAll({parkingFacilityId});
    }

    getVehicleById(id) {
        return this.#vehicles.getById(id);
    }

    getAlertsByFacilityId(parkingFacilityId) {
        return this.#alerts.getAll({parkingFacilityId});
    }

    createAlert(resource) {
        return this.#alerts.create(resource);
    }

    updateAlert(id, resource) {
        return this.#alerts.update(id, resource);
    }

    getAlertRulesByFacilityId(parkingFacilityId) {
        return this.#rules.getAll({parkingFacilityId});
    }

    createAlertRule(resource) {
        return this.#rules.create(resource);
    }

    updateAlertRule(id, resource) {
        return this.#rules.update(id, resource);
    }
}
