
import {Alert} from '../domain/model/alert.entity.js';

export class AlertAssembler {
    static toEntityFromResource(resource) {
        return new Alert({
            id: resource.id,
            parkingFacilityId: resource.parkingFacilityId,
            type: resource.alertType,
            severity: resource.severity,
            status: resource.status,
            contextValue: resource.contextValue ?? null,
            parkingStayId: resource.parkingStayId ?? null,
            accessMovementId: resource.accessMovementId ?? null,
            createdAt: resource.createdAt,
            resolvedAt: resource.resolvedAt ?? null,
            resolvedBy: resource.resolvedBy ?? null,
            note: resource.note ?? null
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200 || !Array.isArray(response.data)) {
            throw new Error('Invalid alerts response');
        }

        return response.data.map(resource =>
            this.toEntityFromResource(resource)
        );
    }

    static toResourceFromEntity(alert) {
        return {
            ...(alert.id != null ? {id: alert.id} : {}),
            parkingFacilityId: alert.parkingFacilityId,
            alertType: alert.type,
            severity: alert.severity,
            status: alert.status,
            contextValue: alert.contextValue,
            parkingStayId: alert.parkingStayId,
            accessMovementId: alert.accessMovementId,
            createdAt: alert.createdAt,
            resolvedAt: alert.resolvedAt,
            resolvedBy: alert.resolvedBy,
            note: alert.note
        };
    }
}
