import {defineStore} from "pinia";
import {computed, ref} from "vue";

import {AccessControlApi} from "../infrastructure/access-control-api.js";
import {AccessMovementAssembler} from "../infrastructure/access-movement.assembler.js";
import {ParkingStayAssembler} from "../infrastructure/parking-stay.assembler.js";

import {AccessMovement} from "../domain/model/access-movement.entity.js";
import {ParkingStay} from "../domain/model/parking-stay.entity.js";
import {MovementType} from "../domain/model/movement-type.js";

import {FacilityAssembler} from "../../parking-management/infrastructure/facility.assembler.js";
import {SpotAssembler} from "../../parking-management/infrastructure/spot.assembler.js";

import {VehicleAssembler} from "../../profiles/infrastructure/vehicle.assembler.js";
import {Vehicle} from "../../profiles/domain/model/vehicle.entity.js";
import {VehicleType} from "../../profiles/domain/model/vehicle-type.js";
import {PlateNumber} from "../../profiles/domain/model/plate-number.js";

const accessControlApi = new AccessControlApi();

function outcome(success, reason) {
    return reason ? {success, reason} : {success};
}

const useAccessControlStore = defineStore('access-control', () => {
    const facilities = ref([]);
    const currentFacility = ref(null);

    const movements = ref([]);
    const stays = ref([]);
    const vehicles = ref([]);

    const facilitiesLoaded = ref(false);
    const accessDataLoaded = ref(false);
    const errors = ref([]);

    const spots = computed(
        () => currentFacility.value?.spots ?? []
    );

    const availableSpots = computed(
        () => spots.value.filter(spot => spot.isAvailable)
    );

    const occupiedSpots = computed(
        () => spots.value.filter(
            spot => spot.status === 'OCCUPIED'
        )
    );

    const activeStays = computed(
        () => stays.value.filter(stay => stay.isOpen)
    );

    const occupancyRate = computed(() => {
        if (!spots.value.length) return 0;

        return Math.round(
            (occupiedSpots.value.length / spots.value.length) * 100
        );
    });

    async function fetchFacilities(operatorProfileId) {
        facilitiesLoaded.value = false;

        try {
            const response =
                await accessControlApi
                    .getFacilitiesByOperatorProfileId(
                        operatorProfileId
                    );

            facilities.value =
                FacilityAssembler
                    .toEntitiesFromResponse(response);

            errors.value = [];
        } catch (error) {
            facilities.value = [];
            errors.value.push(error);
        } finally {
            facilitiesLoaded.value = true;
        }
    }

    async function selectFacility(facilityId) {
        currentFacility.value =
            facilities.value.find(
                facility => facility.id === facilityId
            ) ?? null;

        movements.value = [];
        stays.value = [];
        vehicles.value = [];

        if (!currentFacility.value) {
            accessDataLoaded.value = true;
            return;
        }

        accessDataLoaded.value = false;

        try {
            const [
                spotsResponse,
                movementsResponse,
                staysResponse,
                vehiclesResponse
            ] = await Promise.all([
                accessControlApi
                    .getSpotsByFacilityId(facilityId),

                accessControlApi
                    .getAccessMovementsByFacilityId(
                        facilityId
                    ),

                accessControlApi
                    .getParkingStays(),

                accessControlApi
                    .getVehicles()
            ]);

            currentFacility.value.spots =
                SpotAssembler
                    .toEntitiesFromResponse(spotsResponse);

            movements.value =
                AccessMovementAssembler
                    .toEntitiesFromResponse(
                        movementsResponse
                    )
                    .sort(
                        (a, b) =>
                            new Date(b.occurredAt) -
                            new Date(a.occurredAt)
                    );

            vehicles.value =
                VehicleAssembler
                    .toEntitiesFromResponse(
                        vehiclesResponse
                    );

            const facilitySpotIds =
                new Set(
                    currentFacility.value.spots
                        .map(spot => spot.id)
                );

            stays.value =
                ParkingStayAssembler
                    .toEntitiesFromResponse(
                        staysResponse
                    )
                    .filter(
                        stay =>
                            facilitySpotIds.has(
                                stay.parkingSpotId
                            )
                    );

            errors.value = [];
        } catch (error) {
            errors.value.push(error);
        } finally {
            accessDataLoaded.value = true;
        }
    }

    async function registerAccess(command) {
        const normalizedPlate =
            PlateNumber.normalize(command.plateNumber);

        if (!normalizedPlate) {
            return outcome(
                false,
                'invalid-plate-number'
            );
        }

        const facility =
            facilities.value.find(
                item =>
                    item.id ===
                    command.parkingFacilityId
            );

        if (!facility) {
            return outcome(false, 'failed');
        }

        try {
            const vehicle =
                await findOrRegisterVehicle(
                    normalizedPlate
                );

            if (!vehicle.hasOwner) {
                await recordMovement(
                    command,
                    vehicle.id,
                    'UNDER_REVIEW',
                    'vehicle-under-review'
                );

                return outcome(
                    true,
                    'under-review'
                );
            }

            if (
                command.type ===
                MovementType.ENTRY
            ) {
                return await registerEntry(
                    command,
                    vehicle
                );
            }

            return await registerExit(
                command,
                vehicle
            );
        } catch (error) {
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function registerEntry(command, vehicle) {
        const existingStay =
            findActiveStayByVehicleId(
                vehicle.id
            );

        if (existingStay) {
            await recordMovement(
                command,
                vehicle.id,
                'REJECTED',
                'vehicle-already-inside'
            );

            return outcome(
                false,
                'vehicle-already-inside'
            );
        }

        const reservation =
            await findValidReservation(
                vehicle.id,
                command.reservationCode
            );

        if (!reservation) {
            await recordMovement(
                command,
                vehicle.id,
                'REJECTED',
                'no-active-reservation'
            );

            return outcome(
                false,
                'no-active-reservation'
            );
        }

        const reservedSpot =
            spots.value.find(
                spot =>
                    spot.id ===
                    reservation.parkingSpotId
            );

        let selectedSpot = null;

        if (
            reservedSpot &&
            !reservedSpot.isOutOfService &&
            reservedSpot.status !== 'OCCUPIED'
        ) {
            selectedSpot = reservedSpot;
        } else {
            selectedSpot =
                availableSpots.value.find(
                    spot =>
                        !vehicle.type ||
                        spot.type === vehicle.type
                );
        }

        if (!selectedSpot) {
            await recordMovement(
                command,
                vehicle.id,
                'REJECTED',
                'no-availability'
            );

            return outcome(
                false,
                'no-availability'
            );
        }

        const movement =
            new AccessMovement({
                parkingFacilityId:
                command.parkingFacilityId,
                vehicleId: vehicle.id,
                operatorId: command.operatorId,
                type: MovementType.ENTRY,
                registrationMethod:
                command.registrationMethod,
                occurredAt:
                    new Date().toISOString()
            });

        movement.complete();

        const movementResponse =
            await accessControlApi
                .createAccessMovement(
                    AccessMovementAssembler
                        .toResourceFromEntity(
                            movement
                        )
                );

        const createdMovement =
            AccessMovementAssembler
                .toEntityFromResource(
                    movementResponse.data
                );

        const stay =
            new ParkingStay({
                parkingSpotId:
                selectedSpot.id,
                reservationId:
                reservation.id,
                entryMovementId:
                createdMovement.id
            });

        const stayResponse =
            await accessControlApi
                .createParkingStay(
                    ParkingStayAssembler
                        .toResourceFromEntity(
                            stay
                        )
                );

        const createdStay =
            ParkingStayAssembler
                .toEntityFromResource(
                    stayResponse.data
                );

        selectedSpot.occupy();

        await accessControlApi.updateSpot(
            selectedSpot.id,
            SpotAssembler
                .toResourceFromEntity(
                    selectedSpot
                )
        );

        await accessControlApi
            .updateReservation(
                reservation.id,
                {
                    ...reservation,
                    status: 'ACTIVE'
                }
            );

        movements.value.unshift(
            createdMovement
        );

        stays.value.push(
            createdStay
        );

        errors.value = [];

        return outcome(true);
    }

    async function registerExit(command, vehicle) {
        const stay =
            findActiveStayByVehicleId(
                vehicle.id
            );

        if (!stay) {
            await recordMovement(
                command,
                vehicle.id,
                'REJECTED',
                'no-active-stay'
            );

            return outcome(
                false,
                'no-active-stay'
            );
        }

        const movement =
            new AccessMovement({
                parkingFacilityId:
                command.parkingFacilityId,
                vehicleId: vehicle.id,
                operatorId: command.operatorId,
                type: MovementType.EXIT,
                registrationMethod:
                command.registrationMethod,
                occurredAt:
                    new Date().toISOString()
            });

        movement.complete();

        const movementResponse =
            await accessControlApi
                .createAccessMovement(
                    AccessMovementAssembler
                        .toResourceFromEntity(
                            movement
                        )
                );

        const createdMovement =
            AccessMovementAssembler
                .toEntityFromResource(
                    movementResponse.data
                );

        const entryMovement =
            movementById(
                stay.entryMovementId
            );

        const durationMinutes =
            stay.durationMinutes(
                entryMovement,
                createdMovement.occurredAt
            );

        const chargedAmount =
            Number(
                (
                    Number(
                        currentFacility
                            .value.hourlyRate
                    ) *
                    (
                        durationMinutes /
                        60
                    )
                ).toFixed(2)
            );

        stay.close(
            createdMovement.id,
            chargedAmount
        );

        await accessControlApi
            .updateParkingStay(
                stay.id,
                ParkingStayAssembler
                    .toResourceFromEntity(stay)
            );

        const spot =
            spotById(stay.parkingSpotId);

        if (spot) {
            spot.free();

            await accessControlApi
                .updateSpot(
                    spot.id,
                    SpotAssembler
                        .toResourceFromEntity(
                            spot
                        )
                );
        }

        if (stay.reservationId) {
            const reservationsResponse =
                await accessControlApi
                    .getReservationsByVehicleId(
                        vehicle.id
                    );

            const reservation =
                reservationsResponse.data.find(
                    item =>
                        item.id ===
                        stay.reservationId
                );

            if (reservation) {
                await accessControlApi
                    .updateReservation(
                        reservation.id,
                        {
                            ...reservation,
                            status: 'COMPLETED'
                        }
                    );
            }
        }

        movements.value.unshift(
            createdMovement
        );

        errors.value = [];

        return outcome(true);
    }

    async function recordMovement(
        command,
        vehicleId,
        status,
        reason
    ) {
        const movement =
            new AccessMovement({
                parkingFacilityId:
                command.parkingFacilityId,
                vehicleId,
                operatorId:
                command.operatorId,
                type: command.type,
                registrationMethod:
                command.registrationMethod,
                occurredAt:
                    new Date().toISOString()
            });

        if (status === 'UNDER_REVIEW') {
            movement.sendToReview(reason);
        } else {
            movement.reject(reason);
        }

        const response =
            await accessControlApi
                .createAccessMovement(
                    AccessMovementAssembler
                        .toResourceFromEntity(
                            movement
                        )
                );

        movements.value.unshift(
            AccessMovementAssembler
                .toEntityFromResource(
                    response.data
                )
        );
    }

    async function findOrRegisterVehicle(
        plateNumber
    ) {
        const response =
            await accessControlApi
                .getVehiclesByPlateNumber(
                    plateNumber
                );

        const [existing] =
            VehicleAssembler
                .toEntitiesFromResponse(
                    response
                );

        if (existing) {
            if (
                !vehicles.value.some(
                    vehicle =>
                        vehicle.id === existing.id
                )
            ) {
                vehicles.value.push(existing);
            }

            return existing;
        }

        const type =
            /^[0-9]{4}-[A-Z]{2}$/
                .test(plateNumber)
                ? VehicleType.MOTORCYCLE
                : VehicleType.CAR;

        const vehicle =
            new Vehicle({
                plateNumber:
                    new PlateNumber(
                        plateNumber
                    ),
                type,
                createdAt:
                    new Date().toISOString()
            });

        const createdResponse =
            await accessControlApi
                .createVehicle(
                    VehicleAssembler
                        .toResourceFromEntity(
                            vehicle
                        )
                );

        const created =
            VehicleAssembler
                .toEntityFromResource(
                    createdResponse.data
                );

        vehicles.value.push(created);

        return created;
    }

    async function findValidReservation(
        vehicleId,
        reservationCode = null
    ) {
        const response =
            await accessControlApi
                .getReservationsByVehicleId(
                    vehicleId
                );

        const facilitySpotIds =
            new Set(
                spots.value.map(
                    spot => spot.id
                )
            );

        return response.data.find(
            reservation =>
                facilitySpotIds.has(
                    reservation.parkingSpotId
                ) &&
                [
                    'CONFIRMED',
                    'ACTIVE'
                ].includes(
                    reservation.status
                ) &&
                (
                    !reservationCode ||
                    reservation.code ===
                    reservationCode
                )
        ) ?? null;
    }

    function findActiveStayByVehicleId(
        vehicleId
    ) {
        const entryIds =
            movements.value
                .filter(
                    movement =>
                        movement.vehicleId ===
                        vehicleId &&
                        movement.type ===
                        MovementType.ENTRY &&
                        movement.status ===
                        'COMPLETED'
                )
                .map(
                    movement =>
                        movement.id
                );

        return activeStays.value.find(
            stay =>
                entryIds.includes(
                    stay.entryMovementId
                )
        ) ?? null;
    }

    async function reassignStay(command) {
        const stay =
            activeStays.value.find(
                item =>
                    item.id ===
                    command.parkingStayId
            );

        const newSpot =
            availableSpots.value.find(
                spot =>
                    spot.id ===
                    command.parkingSpotId
            );

        if (!stay || !newSpot) {
            return outcome(
                false,
                'invalid-space'
            );
        }

        const previousSpot =
            spotById(
                stay.parkingSpotId
            );

        const previousSpotId =
            stay.parkingSpotId;

        try {
            if (previousSpot) {
                previousSpot.free();

                await accessControlApi
                    .updateSpot(
                        previousSpot.id,
                        SpotAssembler
                            .toResourceFromEntity(
                                previousSpot
                            )
                    );
            }

            newSpot.occupy();

            await accessControlApi
                .updateSpot(
                    newSpot.id,
                    SpotAssembler
                        .toResourceFromEntity(
                            newSpot
                        )
                );

            stay.reassignSpace(
                newSpot.id
            );

            await accessControlApi
                .updateParkingStay(
                    stay.id,
                    ParkingStayAssembler
                        .toResourceFromEntity(
                            stay
                        )
                );

            errors.value = [];

            return outcome(true);
        } catch (error) {
            stay.parkingSpotId =
                previousSpotId;

            if (previousSpot) {
                previousSpot.occupy();
            }

            newSpot.free();

            errors.value.push(error);

            return outcome(
                false,
                'failed'
            );
        }
    }

    function vehicleById(vehicleId) {
        return vehicles.value.find(
            vehicle =>
                vehicle.id === vehicleId
        ) ?? null;
    }

    function movementById(movementId) {
        return movements.value.find(
            movement =>
                movement.id === movementId
        ) ?? null;
    }

    function spotById(spotId) {
        return spots.value.find(
            spot =>
                spot.id === spotId
        ) ?? null;
    }

    function clear() {
        facilities.value = [];
        currentFacility.value = null;
        movements.value = [];
        stays.value = [];
        vehicles.value = [];
        facilitiesLoaded.value = false;
        accessDataLoaded.value = false;
        errors.value = [];
    }

    return {
        facilities,
        currentFacility,
        movements,
        stays,
        vehicles,
        facilitiesLoaded,
        accessDataLoaded,
        errors,
        spots,
        availableSpots,
        occupiedSpots,
        activeStays,
        occupancyRate,
        fetchFacilities,
        selectFacility,
        registerAccess,
        reassignStay,
        vehicleById,
        movementById,
        spotById,
        clear
    };
});

export default useAccessControlStore;