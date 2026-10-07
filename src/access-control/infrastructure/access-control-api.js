import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const accessMovementsEndpointPath =
    import.meta.env.VITE_ACCESS_MOVEMENTS_ENDPOINT_PATH;

const parkingStaysEndpointPath =
    import.meta.env.VITE_PARKING_STAYS_ENDPOINT_PATH;

const facilitiesEndpointPath =
    import.meta.env.VITE_FACILITIES_ENDPOINT_PATH;

const spotsEndpointPath =
    import.meta.env.VITE_PARKING_SPOTS_ENDPOINT_PATH;

const vehiclesEndpointPath =
    import.meta.env.VITE_VEHICLES_ENDPOINT_PATH;

const reservationsEndpointPath =
    import.meta.env.VITE_RESERVATIONS_ENDPOINT_PATH;

export class AccessControlApi extends BaseApi {
    #accessMovementsEndpoint;
    #parkingStaysEndpoint;
    #facilitiesEndpoint;
    #spotsEndpoint;
    #vehiclesEndpoint;
    #reservationsEndpoint;

    constructor() {
        super();

        this.#accessMovementsEndpoint =
            new BaseEndpoint(this, accessMovementsEndpointPath);

        this.#parkingStaysEndpoint =
            new BaseEndpoint(this, parkingStaysEndpointPath);

        this.#facilitiesEndpoint =
            new BaseEndpoint(this, facilitiesEndpointPath);

        this.#spotsEndpoint =
            new BaseEndpoint(this, spotsEndpointPath);

        this.#vehiclesEndpoint =
            new BaseEndpoint(this, vehiclesEndpointPath);

        this.#reservationsEndpoint =
            new BaseEndpoint(this, reservationsEndpointPath);
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

    getSpotById(spotId) {
        return this.#spotsEndpoint.getById(spotId);
    }

    updateSpot(id, resource) {
        return this.#spotsEndpoint.update(id, resource);
    }

    getVehicles() {
        return this.#vehiclesEndpoint.getAll();
    }

    getVehiclesByPlateNumber(plateNumber) {
        return this.#vehiclesEndpoint.getAll({
            plateNumber
        });
    }

    createVehicle(resource) {
        return this.#vehiclesEndpoint.create(resource);
    }

    getReservationsByVehicleId(vehicleId) {
        return this.#reservationsEndpoint.getAll({
            vehicleId
        });
    }

    updateReservation(id, resource) {
        return this.#reservationsEndpoint.update(id, resource);
    }

    getAccessMovementsByFacilityId(parkingFacilityId) {
        return this.#accessMovementsEndpoint.getAll({
            parkingFacilityId
        });
    }

    createAccessMovement(resource) {
        return this.#accessMovementsEndpoint.create(resource);
    }

    updateAccessMovement(id, resource) {
        return this.#accessMovementsEndpoint.update(id, resource);
    }

    getParkingStays() {
        return this.#parkingStaysEndpoint.getAll();
    }

    createParkingStay(resource) {
        return this.#parkingStaysEndpoint.create(resource);
    }

    updateParkingStay(id, resource) {
        return this.#parkingStaysEndpoint.update(id, resource);
    }
}