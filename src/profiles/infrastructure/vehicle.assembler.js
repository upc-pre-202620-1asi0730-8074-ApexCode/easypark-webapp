import {Vehicle} from "../domain/model/vehicle.entity.js";
import {PlateNumber} from "../domain/model/plate-number.js";

export class VehicleAssembler {
    static toEntityFromResource(resource) {
        return new Vehicle({
            id: resource.id,
            profileId: resource.profileId ?? null,
            plateNumber: new PlateNumber(resource.plateNumber),
            type: resource.vehicleType ?? null,
            color: resource.color ?? null,
            isDefault: Boolean(resource.isDefault),
            createdAt: resource.createdAt
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }
        return response.data.map(resource => this.toEntityFromResource(resource));
    }

    static toResourceFromEntity(vehicle) {
        return {
            ...(vehicle.id !== null ? { id: vehicle.id } : {}),
            profileId: vehicle.profileId,
            plateNumber: vehicle.plateNumber.value,
            vehicleType: vehicle.type,
            color: vehicle.color,
            isDefault: vehicle.isDefault,
            createdAt: vehicle.createdAt
        };
    }
}
