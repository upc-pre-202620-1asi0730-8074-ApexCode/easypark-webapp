import {Alert} from "../domain/model/alert.entity.js";

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
            operatorId: resource.operatorId ?? null,
            createdAt: resource.createdAt,
            resolvedAt: resource.resolvedAt ?? null,
            resolvedBy: resource.resolvedBy ?? null,
            dismissedAt: resource.dismissedAt ?? null,
            note: resource.note ?? null
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        return response.data.map(resource =>
            this.toEntityFromResource(resource)
        );
    }

    static toResourceFromEntity(alert) {
        return {
            ...(alert.id !== null ? {id: alert.id} : {}),
            parkingFacilityId: alert.parkingFacilityId,
            alertType: alert.type,
            severity: alert.severity,
            status: alert.status,
            contextValue: alert.contextValue,
            parkingStayId: alert.parkingStayId,
            accessMovementId: alert.accessMovementId,
            operatorId: alert.operatorId,
            createdAt: alert.createdAt,
            resolvedAt: alert.resolvedAt,
            resolvedBy: alert.resolvedBy,
            dismissedAt: alert.dismissedAt,
            note: alert.note
        };
    }
}
