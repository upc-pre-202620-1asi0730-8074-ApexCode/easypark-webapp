import {Reservation} from "../domain/model/reservation.entity.js";

export class ReservationAssembler {
    static toEntityFromResource(resource) {
        return new Reservation({
            id: resource.id,
            code: resource.code,
            driverProfileId: resource.driverProfileId,
            vehicleId: resource.vehicleId,
            parkingSpotId: resource.parkingSpotId,
            startAt: resource.startAt,
            durationMinutes: resource.durationMinutes,
            estimatedAmount: resource.estimatedAmount ?? 0,
            currency: resource.currency ?? 'PEN',
            status: resource.status,
            createdAt: resource.createdAt
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

    static toResourceFromEntity(reservation) {
        return {
            ...(reservation.id !== null ? {id: reservation.id} : {}),
            code: reservation.code,
            driverProfileId: reservation.driverProfileId,
            vehicleId: reservation.vehicleId,
            parkingSpotId: reservation.parkingSpotId,
            startAt: reservation.startAt,
            durationMinutes: reservation.durationMinutes,
            estimatedAmount: reservation.estimatedAmount,
            currency: reservation.currency,
            status: reservation.status,
            createdAt: reservation.createdAt
        };
    }
}