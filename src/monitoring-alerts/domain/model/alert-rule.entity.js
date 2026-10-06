import {AlertType} from "./alert-type.js";

/**
 * Regla de alerta de un estacionamiento. La unicidad es (parkingFacilityId, alertType):
 * no existen dos reglas del mismo tipo para el mismo estacionamiento.
 */
export class AlertRule {
    constructor({
                    id = null,
                    parkingFacilityId,
                    type,
                    severity,
                    threshold,
                    enabled = true,
                    updatedAt = null
                }) {
        this.id = id;
        this.parkingFacilityId = parkingFacilityId;
        this.type = type;
        this.severity = severity;
        this.threshold = threshold;
        this.enabled = enabled;
        this.updatedAt = updatedAt;
    }

    get isEnabled() {
        return this.enabled;
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }

    updateThreshold(threshold) {
        this.threshold = threshold;
    }

    /**
     * Devuelve las violaciones observadas para esta regla. Cada violación lleva la
     * fuente que la originó para que la creación de alertas sea idempotente.
     */
    evaluate(context) {
        if (!this.enabled) return [];

        switch (this.type) {
            case AlertType.STAY_EXCEEDED:
                return context
                    .exceededStays(this.threshold)
                    .map(
                        ({stay, durationMinutes}) => ({
                            parkingStayId: stay.id,
                            accessMovementId: null,
                            contextValue: durationMinutes
                        })
                    );

            case AlertType.CAPACITY_CRITICAL:
            case AlertType.CAPACITY_NEAR_LIMIT:
                return context.occupancyRate >= this.threshold
                    ? [{
                        parkingStayId: null,
                        accessMovementId: null,
                        contextValue: context.occupancyRate
                    }]
                    : [];

            case AlertType.UNRECOGNIZED_PLATE:
                return context
                    .movementsMatching(
                        movement =>
                            movement.status === 'UNDER_REVIEW',
                        this.threshold
                    )
                    .map(movement => ({
                        parkingStayId: null,
                        accessMovementId: movement.id,
                        contextValue: null
                    }));

            case AlertType.ACCESS_WITHOUT_RESERVATION:
                return context
                    .movementsMatching(
                        movement =>
                            movement.status === 'REJECTED' &&
                            movement.note === 'no-active-reservation',
                        this.threshold
                    )
                    .map(movement => ({
                        parkingStayId: null,
                        accessMovementId: movement.id,
                        contextValue: null
                    }));

            default:
                return [];
        }
    }
}
