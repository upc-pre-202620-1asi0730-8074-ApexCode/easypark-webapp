/**
 * Datos observados en un estacionamiento en un instante dado. Es la entrada de
 * las reglas de alerta: la regla decide, el contexto sólo expone lo medido.
 */
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
        return this.spots.length;
    }

    get occupiedSpots() {
        return this.spots.filter(
            spot => spot.status === 'OCCUPIED'
        ).length;
    }

    get occupancyRate() {
        if (!this.totalSpots) return 0;

        return this.occupiedSpots / this.totalSpots;
    }

    movementById(movementId) {
        return this.movements.find(
            movement => movement.id === movementId
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
                entry => entry.durationMinutes > allowedStayMinutes
            );
    }

    movementsMatching(predicate, minimumCount = 1) {
        const matches = this.movements.filter(predicate);

        return matches.length >= minimumCount ? matches : [];
    }
}
