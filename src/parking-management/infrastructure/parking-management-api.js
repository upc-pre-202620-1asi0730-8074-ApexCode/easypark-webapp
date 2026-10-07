
import {BaseApi} from '../../shared/infrastructure/base-api.js';
import {BaseEndpoint} from '../../shared/infrastructure/base-endpoint.js';

export class ParkingManagementApi extends BaseApi {
    #facilities;
    #spots;
    #reservations;
    #stays;

    constructor() {
        super();

        this.#facilities = new BaseEndpoint(
            this,
            import.meta.env.VITE_FACILITIES_ENDPOINT_PATH
        );

        this.#spots = new BaseEndpoint(
            this,
            import.meta.env.VITE_PARKING_SPOTS_ENDPOINT_PATH
        );

        this.#reservations = new BaseEndpoint(
            this,
            import.meta.env.VITE_RESERVATIONS_ENDPOINT_PATH
        );

        this.#stays = new BaseEndpoint(
            this,
            import.meta.env.VITE_PARKING_STAYS_ENDPOINT_PATH
        );
    }

    getFacilitiesByOperatorProfileId(operatorProfileId) {
        return this.#facilities.getAll({operatorProfileId});
    }

    createFacility(resource) {
        return this.#facilities.create(resource);
    }

    updateFacility(id, resource) {
        return this.#facilities.update(id, resource);
    }

    deleteFacility(id) {
        return this.#facilities.delete(id);
    }

    getSpotsByFacilityId(facilityId) {
        return this.#spots.getAll({facilityId});
    }

    createSpot(resource) {
        return this.#spots.create(resource);
    }

    updateSpot(id, resource) {
        return this.#spots.update(id, resource);
    }

    deleteSpot(id) {
        return this.#spots.delete(id);
    }

    getReservations() {
        return this.#reservations.getAll();
    }

    getParkingStays() {
        return this.#stays.getAll();
    }
}
