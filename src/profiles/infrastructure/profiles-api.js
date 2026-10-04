import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const profilesEndpointPath = import.meta.env.VITE_PROFILES_ENDPOINT_PATH;
const vehiclesEndpointPath = import.meta.env.VITE_VEHICLES_ENDPOINT_PATH;

export class ProfilesApi extends BaseApi {
    #profilesEndpoint;
    #vehiclesEndpoint;

    constructor() {
        super();
        this.#profilesEndpoint = new BaseEndpoint(this, profilesEndpointPath);
        this.#vehiclesEndpoint = new BaseEndpoint(this, vehiclesEndpointPath);
    }

    getProfilesByUserAccountId(userAccountId) {
        return this.#profilesEndpoint.getAll({ userAccountId });
    }

    createProfile(resource) {
        return this.#profilesEndpoint.create(resource);
    }

    updateProfile(id, resource) {
        return this.#profilesEndpoint.update(id, resource);
    }

    getVehiclesByProfileId(profileId) {
        return this.#vehiclesEndpoint.getAll({ profileId });
    }

    getVehiclesByPlateNumber(plateNumber) {
        return this.#vehiclesEndpoint.getAll({ plateNumber });
    }

    createVehicle(resource) {
        return this.#vehiclesEndpoint.create(resource);
    }

    updateVehicle(id, resource) {
        return this.#vehiclesEndpoint.update(id, resource);
    }
}
