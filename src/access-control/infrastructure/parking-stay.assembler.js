import {ParkingStay} from "../domain/model/parking-stay.entity.js";

export class ParkingStayAssembler {
    static toEntityFromResource(resource) {
        return new ParkingStay({
            id: resource.id,
            parkingSpotId: resource.parkingSpotId,
            reservationId: resource.reservationId ?? null,
            entryMovementId: resource.entryMovementId,
            exitMovementId: resource.exitMovementId ?? null,
            chargedAmount: resource.chargedAmount ?? null,
            currency: resource.currency ?? 'PEN'
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

    static toResourceFromEntity(stay) {
        return {
            ...(stay.id !== null ? {id: stay.id} : {}),
            parkingSpotId: stay.parkingSpotId,
            reservationId: stay.reservationId,
            entryMovementId: stay.entryMovementId,
            exitMovementId: stay.exitMovementId,
            chargedAmount: stay.chargedAmount,
            currency: stay.currency
        };
    }
}