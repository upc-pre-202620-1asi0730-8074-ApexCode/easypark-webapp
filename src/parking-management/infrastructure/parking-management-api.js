import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const facilitiesEndpointPath = import.meta.env.VITE_FACILITIES_ENDPOINT_PATH;
const spotsEndpointPath = import.meta.env.VITE_PARKING_SPOTS_ENDPOINT_PATH;

export class ParkingManagementApi extends BaseApi {
    #facilitiesEndpoint;
    #spotsEndpoint;

    constructor() {
        super();
        this.#facilitiesEndpoint = new BaseEndpoint(this, facilitiesEndpointPath);
        this.#spotsEndpoint = new BaseEndpoint(this, spotsEndpointPath);
    }

    getFacilitiesByOperatorProfileId(operatorProfileId) {
        return this.#facilitiesEndpoint.getAll({operatorProfileId});
    }

    createFacility(resource) {
        return this.#facilitiesEndpoint.create(resource);
    }

    updateFacility(id, resource) {
        return this.#facilitiesEndpoint.update(id, resource);
    }

    getSpotsByFacilityId(facilityId) {
        return this.#spotsEndpoint.getAll({facilityId});
    }

    createSpot(resource) {
        return this.#spotsEndpoint.create(resource);
    }

    updateSpot(id, resource) {
        return this.#spotsEndpoint.update(id, resource);
    }
}
