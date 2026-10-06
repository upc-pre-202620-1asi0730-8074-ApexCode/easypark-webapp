import {AccessMovement} from "../domain/model/access-movement.entity.js";

export class AccessMovementAssembler {
    static toEntityFromResource(resource) {
        return new AccessMovement({
            id: resource.id,
            parkingFacilityId: resource.parkingFacilityId,
            vehicleId: resource.vehicleId,
            operatorId: resource.operatorId ?? null,
            type: resource.movementType,
            registrationMethod: resource.registrationMethod,
            status: resource.status,
            occurredAt: resource.occurredAt,
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

    static toResourceFromEntity(movement) {
        return {
            ...(movement.id !== null ? {id: movement.id} : {}),
            parkingFacilityId: movement.parkingFacilityId,
            vehicleId: movement.vehicleId,
            operatorId: movement.operatorId,
            movementType: movement.type,
            registrationMethod: movement.registrationMethod,
            status: movement.status,
            occurredAt: movement.occurredAt,
            note: movement.note
        };
    }
}