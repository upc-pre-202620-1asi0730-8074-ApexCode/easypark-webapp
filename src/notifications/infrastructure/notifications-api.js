import {BaseApi} from "../../shared/infrastructure/base-api.js";
import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";

const notificationsEndpointPath =
    import.meta.env.VITE_NOTIFICATIONS_ENDPOINT_PATH;

const notificationTemplatesEndpointPath =
    import.meta.env.VITE_NOTIFICATION_TEMPLATES_ENDPOINT_PATH;

const reservationsEndpointPath =
    import.meta.env.VITE_RESERVATIONS_ENDPOINT_PATH;

const vehiclesEndpointPath =
    import.meta.env.VITE_VEHICLES_ENDPOINT_PATH;

const accessMovementsEndpointPath =
    import.meta.env.VITE_ACCESS_MOVEMENTS_ENDPOINT_PATH;

const parkingStaysEndpointPath =
    import.meta.env.VITE_PARKING_STAYS_ENDPOINT_PATH;

const alertsEndpointPath =
    import.meta.env.VITE_ALERTS_ENDPOINT_PATH;

const alertRulesEndpointPath =
    import.meta.env.VITE_ALERT_RULES_ENDPOINT_PATH;

const facilitiesEndpointPath =
    import.meta.env.VITE_FACILITIES_ENDPOINT_PATH;

const spotsEndpointPath =
    import.meta.env.VITE_PARKING_SPOTS_ENDPOINT_PATH;

const profilesEndpointPath =
    import.meta.env.VITE_PROFILES_ENDPOINT_PATH;

/**
 * Notifications owns two collections of its own and reads (never writes) the
 * source collections of the other bounded contexts, the same way Monitoring
 * reads facilities, spots, stays and movements. This class plus the two
 * assemblers is the local stand-in for the diagram's INotificationRepository
 * and INotificationTemplateRepository: no bounded context in this application
 * implements repository interfaces or gateways.
 */
export class NotificationsApi extends BaseApi {
    #notificationsEndpoint;
    #notificationTemplatesEndpoint;
    #reservationsEndpoint;
    #vehiclesEndpoint;
    #accessMovementsEndpoint;
    #parkingStaysEndpoint;
    #alertsEndpoint;
    #alertRulesEndpoint;
    #facilitiesEndpoint;
    #spotsEndpoint;
    #profilesEndpoint;

    constructor() {
        super();

        this.#notificationsEndpoint =
            new BaseEndpoint(this, notificationsEndpointPath);

        this.#notificationTemplatesEndpoint =
            new BaseEndpoint(this, notificationTemplatesEndpointPath);

        this.#reservationsEndpoint =
            new BaseEndpoint(this, reservationsEndpointPath);

        this.#vehiclesEndpoint =
            new BaseEndpoint(this, vehiclesEndpointPath);

        this.#accessMovementsEndpoint =
            new BaseEndpoint(this, accessMovementsEndpointPath);

        this.#parkingStaysEndpoint =
            new BaseEndpoint(this, parkingStaysEndpointPath);

        this.#alertsEndpoint =
            new BaseEndpoint(this, alertsEndpointPath);

        this.#alertRulesEndpoint =
            new BaseEndpoint(this, alertRulesEndpointPath);

        this.#facilitiesEndpoint =
            new BaseEndpoint(this, facilitiesEndpointPath);

        this.#spotsEndpoint =
            new BaseEndpoint(this, spotsEndpointPath);

        this.#profilesEndpoint =
            new BaseEndpoint(this, profilesEndpointPath);
    }

    getNotificationsByRecipientId(recipientId) {
        return this.#notificationsEndpoint.getAll({
            recipientId
        });
    }

    getNotificationTemplates() {
        return this.#notificationTemplatesEndpoint.getAll();
    }

    createNotification(resource) {
        return this.#notificationsEndpoint.create(resource);
    }

    updateNotification(id, resource) {
        return this.#notificationsEndpoint.update(id, resource);
    }

    getProfileByUserAccountId(userAccountId) {
        return this.#profilesEndpoint.getAll({
            userAccountId
        });
    }

    getReservationsByDriverProfileId(driverProfileId) {
        return this.#reservationsEndpoint.getAll({
            driverProfileId
        });
    }

    getVehiclesByProfileId(profileId) {
        return this.#vehiclesEndpoint.getAll({
            profileId
        });
    }

    getAccessMovements() {
        return this.#accessMovementsEndpoint.getAll();
    }

    getParkingStays() {
        return this.#parkingStaysEndpoint.getAll();
    }

    getAlerts() {
        return this.#alertsEndpoint.getAll();
    }

    getAlertRules() {
        return this.#alertRulesEndpoint.getAll();
    }

    getParkingFacilities() {
        return this.#facilitiesEndpoint.getAll();
    }

    getParkingSpots() {
        return this.#spotsEndpoint.getAll();
    }
}
