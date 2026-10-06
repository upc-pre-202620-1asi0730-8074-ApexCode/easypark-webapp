import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const alertsEndpointPath =
    import.meta.env.VITE_ALERTS_ENDPOINT_PATH;

const alertRulesEndpointPath =
    import.meta.env.VITE_ALERT_RULES_ENDPOINT_PATH;

const facilitiesEndpointPath =
    import.meta.env.VITE_FACILITIES_ENDPOINT_PATH;

const spotsEndpointPath =
    import.meta.env.VITE_PARKING_SPOTS_ENDPOINT_PATH;

const parkingStaysEndpointPath =
    import.meta.env.VITE_PARKING_STAYS_ENDPOINT_PATH;

const accessMovementsEndpointPath =
    import.meta.env.VITE_ACCESS_MOVEMENTS_ENDPOINT_PATH;

export class MonitoringAlertsApi extends BaseApi {
    #alertsEndpoint;
    #alertRulesEndpoint;
    #facilitiesEndpoint;
    #spotsEndpoint;
    #parkingStaysEndpoint;
    #accessMovementsEndpoint;

    constructor() {
        super();

        this.#alertsEndpoint =
            new BaseEndpoint(this, alertsEndpointPath);

        this.#alertRulesEndpoint =
            new BaseEndpoint(this, alertRulesEndpointPath);

        this.#facilitiesEndpoint =
            new BaseEndpoint(this, facilitiesEndpointPath);

        this.#spotsEndpoint =
            new BaseEndpoint(this, spotsEndpointPath);

        this.#parkingStaysEndpoint =
            new BaseEndpoint(this, parkingStaysEndpointPath);

        this.#accessMovementsEndpoint =
            new BaseEndpoint(this, accessMovementsEndpointPath);
    }

    getAlertsByFacilityId(parkingFacilityId) {
        return this.#alertsEndpoint.getAll({
            parkingFacilityId
        });
    }

    createAlert(resource) {
        return this.#alertsEndpoint.create(resource);
    }

    updateAlert(id, resource) {
        return this.#alertsEndpoint.update(id, resource);
    }

    getAlertRulesByFacilityId(parkingFacilityId) {
        return this.#alertRulesEndpoint.getAll({
            parkingFacilityId
        });
    }

    getFacilitiesByOperatorProfileId(operatorProfileId) {
        return this.#facilitiesEndpoint.getAll({
            operatorProfileId
        });
    }

    getSpotsByFacilityId(facilityId) {
        return this.#spotsEndpoint.getAll({
            facilityId
        });
    }

    getParkingStays() {
        return this.#parkingStaysEndpoint.getAll();
    }

    getAccessMovementsByFacilityId(parkingFacilityId) {
        return this.#accessMovementsEndpoint.getAll({
            parkingFacilityId
        });
    }
}
