
export class MonitoringContext {
    constructor({
                    parkingFacilityId,
                    spots = [],
                    stays = [],
                    movements = [],
                    now = new Date()
                }) {
        this.parkingFacilityId = parkingFacilityId;
        this.spots = spots;
        this.stays = stays;
        this.movements = movements;
        this.now = now instanceof Date ? now : new Date(now);
    }

    get totalSpots() {
        return this.spots.filter(
            spot => spot.status !== 'OUT_OF_SERVICE'
        ).length;
    }

    get occupiedSpots() {
        return this.spots.filter(
            spot => spot.status === 'OCCUPIED'
        ).length;
    }

    get occupancyRate() {
        if (this.totalSpots === 0) return 0;

        return this.occupiedSpots / this.totalSpots;
    }

    movementById(movementId) {
        return this.movements.find(
            movement => String(movement.id) === String(movementId)
        ) ?? null;
    }

    exceededStays(allowedStayMinutes) {
        return this.stays
            .filter(stay => stay.isOpen)
            .map(stay => ({
                stay,
                durationMinutes: stay.durationMinutes(
                    this.movementById(stay.entryMovementId),
                    this.now
                )
            }))
            .filter(
                entry => Number.isFinite(entry.durationMinutes) &&
                    entry.durationMinutes > allowedStayMinutes
            );
    }
}
