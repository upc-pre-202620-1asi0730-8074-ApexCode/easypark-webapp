import {ReservationStatus} from "./reservation-status.js";

export class Reservation {
    constructor({
                    id = null,
                    code = null,
                    driverProfileId,
                    vehicleId,
                    parkingSpotId,
                    startAt,
                    durationMinutes,
                    estimatedAmount = 0,
                    currency = 'PEN',
                    status = ReservationStatus.PENDING,
                    createdAt
                }) {
        this.id = id;
        this.code = code;
        this.driverProfileId = driverProfileId;
        this.vehicleId = vehicleId;
        this.parkingSpotId = parkingSpotId;
        this.startAt = startAt;
        this.durationMinutes = durationMinutes;
        this.estimatedAmount = estimatedAmount;
        this.currency = currency;
        this.status = status;
        this.createdAt = createdAt;
    }

    get isActive() {
        return this.status === ReservationStatus.ACTIVE;
    }

    confirm() {
        this.status = ReservationStatus.CONFIRMED;
    }

    activate() {
        this.status = ReservationStatus.ACTIVE;
    }

    complete() {
        this.status = ReservationStatus.COMPLETED;
    }

    cancel() {
        this.status = ReservationStatus.CANCELLED;
    }

    expire() {
        this.status = ReservationStatus.EXPIRED;
    }
}