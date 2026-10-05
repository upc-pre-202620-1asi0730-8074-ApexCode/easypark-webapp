import {ParkingFacility} from "../domain/model/parking-facility.entity.js";

export class FacilityAssembler {
    static toEntityFromResource(resource) {
        return new ParkingFacility({
            id: resource.id,
            operatorProfileId: resource.operatorProfileId,
            name: resource.name,
            address: resource.address,
            latitude: resource.latitude ?? null,
            longitude: resource.longitude ?? null,
            hourlyRate: resource.hourlyRate,
            openTime: resource.openTime,
            closeTime: resource.closeTime,
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

    static toResourceFromEntity(facility) {
        return {
            ...(facility.id !== null ? {id: facility.id} : {}),
            operatorProfileId: facility.operatorProfileId,
            name: facility.name,
            address: facility.address,
            latitude: facility.latitude,
            longitude: facility.longitude,
            hourlyRate: facility.hourlyRate,
            openTime: facility.openTime,
            closeTime: facility.closeTime,
            status: facility.status,
            createdAt: facility.createdAt
        };
    }
}
