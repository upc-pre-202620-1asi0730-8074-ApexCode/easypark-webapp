import {BaseApi} from '../../shared/infrastructure/base-api.js';
import {BaseEndpoint} from '../../shared/infrastructure/base-endpoint.js';

export class ReservationsApi extends BaseApi {
    #reservations;
    #facilities;
    #spots;
    constructor() {
        super();
        this.#reservations = new BaseEndpoint(this, import.meta.env.VITE_RESERVATIONS_ENDPOINT_PATH);
        this.#facilities = new BaseEndpoint(this, import.meta.env.VITE_FACILITIES_ENDPOINT_PATH);
        this.#spots = new BaseEndpoint(this, import.meta.env.VITE_PARKING_SPOTS_ENDPOINT_PATH);
    }
    getReservationsByDriverProfileId(driverProfileId) {
        return this.#reservations.getAll({driverProfileId});
    }
    getFacilities() { return this.#facilities.getAll(); }
    getSpotsByFacilityId(facilityId) { return this.#spots.getAll({facilityId}); }
    createReservation(resource) { return this.#reservations.create(resource); }
    updateReservation(id, resource) { return this.#reservations.update(id, resource); }
}
