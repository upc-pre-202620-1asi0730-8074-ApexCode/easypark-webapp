import {AlertStatus} from "./alert-status.js";

export class Alert {
    constructor({
                    id = null,
                    parkingFacilityId,
                    type,
                    severity,
                    status = AlertStatus.ACTIVE,
                    contextValue = null,
                    parkingStayId = null,
                    accessMovementId = null,
                    operatorId = null,
                    createdAt,
                    resolvedAt = null,
                    resolvedBy = null,
                    dismissedAt = null,
                    note = null
                }) {
        this.id = id;
        this.parkingFacilityId = parkingFacilityId;
        this.type = type;
        this.severity = severity;
        this.status = status;
        this.contextValue = contextValue;
        this.parkingStayId = parkingStayId;
        this.accessMovementId = accessMovementId;
        this.operatorId = operatorId;
        this.createdAt = createdAt;
        this.resolvedAt = resolvedAt;
        this.resolvedBy = resolvedBy;
        this.dismissedAt = dismissedAt;
        this.note = note;
    }

    get isActive() {
        return this.status === AlertStatus.ACTIVE;
    }

    get isResolved() {
        return this.status === AlertStatus.RESOLVED;
    }

    /**
     * Minutos entre la detección y la resolución. Sólo una alerta resuelta tiene duración.
     */
    get resolutionMinutes() {
        if (!this.resolvedAt) return null;

        return Math.max(
            0,
            Math.floor(
                (new Date(this.resolvedAt) - new Date(this.createdAt)) / 60000
            )
        );
    }

    /**
     * US31: resolver una alerta que ya no está activa no tiene efecto.
     * Una alerta resuelta permanece resuelta con su fecha original.
     */
    resolve(resolvedBy, note = null, now = new Date()) {
        if (!this.isActive) return false;

        this.status = AlertStatus.RESOLVED;
        this.resolvedAt = this.#toIso(now);
        this.resolvedBy = resolvedBy;
        this.note = note;

        return true;
    }

    dismiss(operatorId, note = null, now = new Date()) {
        if (!this.isActive) return false;

        this.status = AlertStatus.DISMISSED;
        this.dismissedAt = this.#toIso(now);
        this.operatorId = operatorId;
        this.note = note;

        return true;
    }

    #toIso(value) {
        return value instanceof Date
            ? value.toISOString()
            : value;
    }
}
