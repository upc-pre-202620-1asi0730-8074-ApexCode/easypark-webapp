import {ParkingSpot} from "../domain/model/parking-spot.entity.js";

export class SpotAssembler {
    static toEntityFromResource(resource) {
        return new ParkingSpot({
            id: resource.id,
            facilityId: resource.facilityId,
            code: resource.code,
            level: resource.level ?? 1,
            type: resource.spotType,
            status: resource.status,
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

    static toResourceFromEntity(spot) {
        return {
            ...(spot.id !== null ? {id: spot.id} : {}),
            facilityId: spot.facilityId,
            code: spot.code,
            level: spot.level,
            spotType: spot.type,
            status: spot.status,
            createdAt: spot.createdAt
        };
    }
}
