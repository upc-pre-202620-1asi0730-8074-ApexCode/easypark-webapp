export class ParkingStay {
    constructor({
                    id = null,
                    parkingSpotId,
                    reservationId = null,
                    entryMovementId,
                    exitMovementId = null,
                    chargedAmount = null,
                    currency = 'PEN'
                }) {
        this.id = id;
        this.parkingSpotId = parkingSpotId;
        this.reservationId = reservationId;
        this.entryMovementId = entryMovementId;
        this.exitMovementId = exitMovementId;
        this.chargedAmount = chargedAmount;
        this.currency = currency;
    }

    get isOpen() {
        return this.exitMovementId === null;
    }

    close(exitMovementId, chargedAmount = null) {
        this.exitMovementId = exitMovementId;
        this.chargedAmount = chargedAmount;
    }

    reassignSpace(parkingSpotId) {
        this.parkingSpotId = parkingSpotId;
    }

    durationMinutes(entryMovement, now = new Date()) {
        if (!entryMovement?.occurredAt) return 0;

        const start = new Date(entryMovement.occurredAt);
        const end = new Date(now);

        return Math.max(
            0,
            Math.floor((end - start) / 60000)
        );
    }

    hasExceededTime(entryMovement, allowedStayMinutes, now = new Date()) {
        return this.durationMinutes(entryMovement, now) > allowedStayMinutes;
    }
}