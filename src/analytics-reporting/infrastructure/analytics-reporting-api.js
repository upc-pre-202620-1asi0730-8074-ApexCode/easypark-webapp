import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const reportsEndpointPath =
    import.meta.env.VITE_REPORTS_ENDPOINT_PATH;

const occupancyMetricsEndpointPath =
    import.meta.env.VITE_OCCUPANCY_METRICS_ENDPOINT_PATH;

const facilitiesEndpointPath =
    import.meta.env.VITE_FACILITIES_ENDPOINT_PATH;

const spotsEndpointPath =
    import.meta.env.VITE_PARKING_SPOTS_ENDPOINT_PATH;

const movementsEndpointPath =
    import.meta.env.VITE_ACCESS_MOVEMENTS_ENDPOINT_PATH;

const staysEndpointPath =
    import.meta.env.VITE_PARKING_STAYS_ENDPOINT_PATH;

const vehiclesEndpointPath =
    import.meta.env.VITE_VEHICLES_ENDPOINT_PATH;

export class AnalyticsReportingApi extends BaseApi {
    #reportsEndpoint;
    #occupancyMetricsEndpoint;
    #facilitiesEndpoint;
    #spotsEndpoint;
    #movementsEndpoint;
    #staysEndpoint;
    #vehiclesEndpoint;

    constructor() {
        super();

        this.#reportsEndpoint =
            new BaseEndpoint(
                this,
                reportsEndpointPath
            );

        this.#occupancyMetricsEndpoint =
            new BaseEndpoint(
                this,
                occupancyMetricsEndpointPath
            );

        this.#facilitiesEndpoint =
            new BaseEndpoint(
                this,
                facilitiesEndpointPath
            );

        this.#spotsEndpoint =
            new BaseEndpoint(
                this,
                spotsEndpointPath
            );

        this.#movementsEndpoint =
            new BaseEndpoint(
                this,
                movementsEndpointPath
            );

        this.#staysEndpoint =
            new BaseEndpoint(
                this,
                staysEndpointPath
            );

        this.#vehiclesEndpoint =
            new BaseEndpoint(
                this,
                vehiclesEndpointPath
            );
    }

    getFacilitiesByOperatorProfileId(
        operatorProfileId
    ) {
        return this.#facilitiesEndpoint.getAll({
            operatorProfileId
        });
    }

    getSpotsByFacilityId(facilityId) {
        return this.#spotsEndpoint.getAll({
            facilityId
        });
    }

    getMovementsByFacilityId(
        parkingFacilityId
    ) {
        return this.#movementsEndpoint.getAll({
            parkingFacilityId
        });
    }

    getParkingStays() {
        return this.#staysEndpoint.getAll();
    }

    getVehicles() {
        return this.#vehiclesEndpoint.getAll();
    }

    getReportsByFacilityId(
        parkingFacilityId
    ) {
        return this.#reportsEndpoint.getAll({
            parkingFacilityId
        });
    }

    createReport(resource) {
        return this.#reportsEndpoint.create(
            resource
        );
    }

    getMetricsByFacilityId(
        parkingFacilityId
    ) {
        return this.#occupancyMetricsEndpoint.getAll({
            parkingFacilityId
        });
    }

    createOccupancyMetric(resource) {
        return this.#occupancyMetricsEndpoint.create(
            resource
        );
    }
}