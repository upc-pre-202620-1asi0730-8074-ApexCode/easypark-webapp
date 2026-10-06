import {AlertType} from "./alert-type.js";

/**
 * Configurable alert rule of a parking facility. It holds only configurable
 * rules: capacity thresholds and the maximum stay minutes. The uniqueness is
 * (parkingFacilityId, alertType): there are no two rules of the same type for
 * the same parking facility.
 *
 * Alert types produced by reacting to Access Control events (for example,
 * UNRECOGNIZED_PLATE or ACCESS_WITHOUT_RESERVATION) are not configured here.
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

            default:
                return [];
        }
    }
}
