import {BaseApi} from '../../shared/infrastructure/base-api.js';
import {BaseEndpoint} from '../../shared/infrastructure/base-endpoint.js';

export class AccessControlApi extends BaseApi {
    #facilities;
    #spots;
    #movements;
    #stays;
    #vehicles;
    constructor() {
        super();
        this.#facilities = new BaseEndpoint(this, import.meta.env.VITE_FACILITIES_ENDPOINT_PATH);
        this.#spots = new BaseEndpoint(this, import.meta.env.VITE_PARKING_SPOTS_ENDPOINT_PATH);
        this.#movements = new BaseEndpoint(this, import.meta.env.VITE_ACCESS_MOVEMENTS_ENDPOINT_PATH);
        this.#stays = new BaseEndpoint(this, import.meta.env.VITE_PARKING_STAYS_ENDPOINT_PATH);
        this.#vehicles = new BaseEndpoint(this, import.meta.env.VITE_VEHICLES_ENDPOINT_PATH);
    }
    getFacilitiesByOperatorProfileId(operatorProfileId) { return this.#facilities.getAll({operatorProfileId}); }
    getSpotsByFacilityId(facilityId) { return this.#spots.getAll({facilityId}); }
    getAccessMovementsByFacilityId(parkingFacilityId) { return this.#movements.getAll({parkingFacilityId}); }
    getParkingStaysByFacilityId(parkingFacilityId) { return this.#stays.getAll({parkingFacilityId}); }
    getVehicleById(id) { return this.#vehicles.getById(id); }
    createAccessMovement(resource) { return this.#movements.create(resource); }
    updateAccessMovement(id, resource) { return this.#movements.update(id, resource); }
    updateParkingStay(id, resource) { return this.#stays.update(id, resource); }
}
