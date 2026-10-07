import {ReservationStatus} from "../../../reservations/domain/model/reservation-status.js";
import {MovementStatus} from "../../../access-control/domain/model/movement-status.js";
import {MovementType} from "../../../access-control/domain/model/movement-type.js";
import {AlertType} from "../../../monitoring-alerts/domain/model/alert-type.js";

import {NotificationPayload} from "./notification-payload.js";


export const TIME_REMAINING_NOTICE_MINUTES = 30;
export const RESERVATION_REMINDER_WINDOW_MINUTES = 60;

const DEFAULT_TEMPLATE_LOCALE = 'en';

const NOTIFIED_RESERVATION_STATUSES = Object.freeze([
    ReservationStatus.CONFIRMED,
    ReservationStatus.ACTIVE
]);


export class NotificationContext {
    constructor({
                    recipientId,
                    reservations = [],
                    vehicles = [],
                    movements = [],
                    stays = [],
                    alerts = [],
                    alertRules = [],
                    spots = [],
                    facilities = [],
                    templates = [],
                    now = new Date()
                }) {
        this.recipientId = recipientId;
        this.reservations = reservations;
        this.vehicles = vehicles;
        this.movements = movements;
        this.stays = stays;
        this.alerts = alerts;
        this.alertRules = alertRules;
        this.spots = spots;
        this.facilities = facilities;
        this.templates = templates;
        this.now = now instanceof Date ? now : new Date(now);
    }


    driverVehicleIds() {
        return this.vehicles.map(vehicle => vehicle.id);
    }

    movementById(movementId) {
        return this.movements.find(
            movement => movement.id === movementId
        ) ?? null;
    }

    /**
     * Stays of the driver: reached through `entryMovementId` → movement
     * `vehicleId` ∈ the driver's vehicles. Every stay rule below is scoped by
     * this set, never by a bare id from another collection.
     */
    driverStays() {
        const vehicleIds = this.driverVehicleIds();

        return this.stays.filter(stay => {
            const entryMovement = this.movementById(stay.entryMovementId);

            return Boolean(entryMovement) &&
                vehicleIds.includes(entryMovement.vehicleId);
        });
    }

    reservationsNeedingConfirmation() {
        return this.reservations.filter(
            reservation =>
                NOTIFIED_RESERVATION_STATUSES.includes(reservation.status)
        );
    }

    reservationsApproachingStart() {
        const latestStart = new Date(
            this.now.getTime() +
            RESERVATION_REMINDER_WINDOW_MINUTES * 60000
        );

        return this.reservations.filter(
            reservation =>
                NOTIFIED_RESERVATION_STATUSES.includes(reservation.status) &&
                reservation.startAt &&
                new Date(reservation.startAt) >= this.now &&
                new Date(reservation.startAt) <= latestStart
        );
    }


    staysWithCompletedEntry() {
        return this.driverStays().filter(
            stay =>
                this.movementById(stay.entryMovementId)?.status ===
                MovementStatus.COMPLETED
        );
    }


    closedStays() {
        return this.driverStays().filter(stay => !stay.isOpen);
    }

    driverAlerts() {
        const stayIds = new Set(
            this.driverStays().map(stay => stay.id)
        );

        return this.alerts.filter(
            alert =>
                alert.parkingStayId !== null &&
                alert.parkingStayId !== undefined &&
                stayIds.has(alert.parkingStayId)
        );
    }


    allowedStayMinutes() {
        const rule = this.alertRules.find(
            item => item.type === AlertType.STAY_EXCEEDED
        );

        return rule?.threshold ?? 480;
    }


    openStaysApproachingLimit() {
        const allowed = this.allowedStayMinutes();
        const noticeFrom = allowed - TIME_REMAINING_NOTICE_MINUTES;

        return this.#openDriverStaysWithDuration()
            .filter(
                ({durationMinutes}) =>
                    durationMinutes >= noticeFrom &&
                    durationMinutes < allowed
            )
            .map(({stay}) => stay);
    }


    openStaysOverLimit() {
        const allowed = this.allowedStayMinutes();

        return this.#openDriverStaysWithDuration()
            .filter(({durationMinutes}) => durationMinutes >= allowed)
            .map(({stay}) => stay);
    }


    payloadFor({reservationId = null, parkingStayId = null, alertId = null}) {
        const reservation = reservationId === null
            ? null
            : this.reservations.find(item => item.id === reservationId) ?? null;

        const stay = parkingStayId === null
            ? null
            : this.stays.find(item => item.id === parkingStayId) ?? null;

        const alert = alertId === null
            ? null
            : this.alerts.find(item => item.id === alertId) ?? null;


        const stayForDisplay = stay ?? (alert
            ? this.stays.find(item => item.id === alert.parkingStayId) ?? null
            : null);

        const parkingSpotId =
            reservation?.parkingSpotId ??
            stayForDisplay?.parkingSpotId ??
            null;

        const entryMovement = stayForDisplay
            ? this.movementById(stayForDisplay.entryMovementId)
            : null;

        const vehicleId =
            reservation?.vehicleId ??
            entryMovement?.vehicleId ??
            null;

        return new NotificationPayload({
            recipientId: this.recipientId,
            reservationId,
            parkingStayId,
            alertId,
            zoneName: this.#zoneNameOf(
                parkingSpotId,
                alert?.parkingFacilityId ?? null
            ),
            spaceCode: this.#spaceCodeOf(parkingSpotId),
            plateNumber: this.#plateNumberOf(vehicleId),
            scheduledFor: reservation?.startAt ?? null
        });
    }


    templateFor(type, locale) {
        return this.templates.find(
                template =>
                    template.type === type && template.locale === locale
            ) ??
            this.templates.find(
                template =>
                    template.type === type &&
                    template.locale === DEFAULT_TEMPLATE_LOCALE
            ) ??
            this.templates.find(template => template.type === type) ??
            null;
    }

    #zoneNameOf(parkingSpotId, facilityFallbackId = null) {
        const spot = parkingSpotId === null
            ? null
            : this.spots.find(item => item.id === parkingSpotId) ?? null;

        const facilityId = spot?.facilityId ?? facilityFallbackId;

        const facility = facilityId === null || facilityId === undefined
            ? null
            : this.facilities.find(item => item.id === facilityId) ?? null;

        return facility?.name ?? null;
    }

    #spaceCodeOf(parkingSpotId) {
        if (parkingSpotId === null) return null;

        return this.spots.find(item => item.id === parkingSpotId)?.code ?? null;
    }

    #plateNumberOf(vehicleId) {
        const vehicle = vehicleId === null || vehicleId === undefined
            ? null
            : this.vehicles.find(item => item.id === vehicleId) ?? null;

        const plate =
            vehicle ??
            this.vehicles.find(item => item.isDefault) ??
            this.vehicles[0] ??
            null;

        return plate?.plateNumber ?? null;
    }

    #openDriverStaysWithDuration() {
        return this.driverStays()
            .filter(stay => stay.isOpen)
            .map(stay => ({
                stay,
                durationMinutes: stay.durationMinutes(
                    this.movementById(stay.entryMovementId),
                    this.now
                )
            }));
    }
}
