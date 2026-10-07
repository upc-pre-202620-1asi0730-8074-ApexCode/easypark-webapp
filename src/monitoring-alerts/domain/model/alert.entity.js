
import {AlertStatus} from './alert-status.js';

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
                    createdAt = new Date().toISOString(),
                    resolvedAt = null,
                    resolvedBy = null,
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
        this.createdAt = createdAt;
        this.resolvedAt = resolvedAt;
        this.resolvedBy = resolvedBy;
        this.note = note;
    }

    get isActive() {
        return this.status === AlertStatus.ACTIVE;
    }

    get isResolved() {
        return this.status === AlertStatus.RESOLVED;
    }

    get resolutionMinutes() {
        if (!this.resolvedAt || !this.createdAt) return null;

        const elapsed = new Date(this.resolvedAt) - new Date(this.createdAt);
        if (!Number.isFinite(elapsed)) return null;

        return Math.max(0, Math.floor(elapsed / 60000));
    }

    resolve(resolvedBy, note = null, now = new Date()) {
        if (!this.isActive) return false;

        const date = now instanceof Date ? now : new Date(now);
        if (Number.isNaN(date.getTime())) return false;

        this.status = AlertStatus.RESOLVED;
        this.resolvedAt = date.toISOString();
        this.resolvedBy = resolvedBy;
        this.note = note;

        return true;
    }
}
