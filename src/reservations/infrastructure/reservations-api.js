import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const reservationsEndpointPath = import.meta.env.VITE_RESERVATIONS_ENDPOINT_PATH;
const facilitiesEndpointPath = import.meta.env.VITE_FACILITIES_ENDPOINT_PATH;
const spotsEndpointPath = import.meta.env.VITE_PARKING_SPOTS_ENDPOINT_PATH;

export class ReservationsApi extends BaseApi {
    #reservationsEndpoint;
    #facilitiesEndpoint;
    #spotsEndpoint;

    constructor() {
        super();

        this.#reservationsEndpoint =
            new BaseEndpoint(this, reservationsEndpointPath);

        this.#facilitiesEndpoint =
            new BaseEndpoint(this, facilitiesEndpointPath);

        this.#spotsEndpoint =
            new BaseEndpoint(this, spotsEndpointPath);
    }

    getReservationsByDriverProfileId(driverProfileId) {
        return this.#reservationsEndpoint.getAll({driverProfileId});
    }

    getFacilities() {
        return this.#facilitiesEndpoint.getAll();
    }

    getSpotsByFacilityId(facilityId) {
        return this.#spotsEndpoint.getAll({facilityId});
    }

    getSpotById(spotId) {
        return this.#spotsEndpoint.getById(spotId);
    }

    createReservation(resource) {
        return this.#reservationsEndpoint.create(resource);
    }

    updateReservation(id, resource) {
        return this.#reservationsEndpoint.update(id, resource);
    }

    updateSpot(id, resource) {
        return this.#spotsEndpoint.update(id, resource);
    }
}