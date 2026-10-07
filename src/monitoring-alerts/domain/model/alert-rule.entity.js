
import {AlertType} from './alert-type.js';

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
        return this.enabled === true;
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

    evaluate(context) {
        if (!this.isEnabled) return [];

        const threshold = Number(this.threshold);
        if (this.threshold == null || !Number.isFinite(threshold)) {
            return [];
        }

        switch (this.type) {
            case AlertType.STAY_EXCEEDED:
                if (threshold < 0) return [];

                return context.exceededStays(threshold).map(
                    ({stay, durationMinutes}) => ({
                        parkingStayId: stay.id,
                        accessMovementId: null,
                        contextValue: durationMinutes
                    })
                );

            case AlertType.CAPACITY_CRITICAL:
            case AlertType.CAPACITY_NEAR_LIMIT:
                if (
                    threshold < 0 ||
                    threshold > 1 ||
                    context.totalSpots === 0
                ) {
                    return [];
                }

                return context.occupancyRate >= threshold
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
