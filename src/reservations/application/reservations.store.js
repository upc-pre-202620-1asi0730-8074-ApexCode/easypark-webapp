import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {ReservationsApi} from "../infrastructure/reservations-api.js";
import {ReservationAssembler} from "../infrastructure/reservation.assembler.js";
import {Reservation} from "../domain/model/reservation.entity.js";
import {ReservationStatus} from "../domain/model/reservation-status.js";
import {FacilityAssembler} from "../../parking-management/infrastructure/facility.assembler.js";
import {SpotAssembler} from "../../parking-management/infrastructure/spot.assembler.js";
import useProfilesStore from "../../profiles/application/profiles.store.js";

const reservationsApi = new ReservationsApi();

function outcome(success, reason) {
    return reason ? {success, reason} : {success};
}

const useReservationsStore = defineStore('reservations', () => {
    const reservations = ref([]);
    const facilities = ref([]);
    const reservationsLoaded = ref(false);
    const facilitiesLoaded = ref(false);
    const errors = ref([]);

    const activeReservations = computed(() =>
        reservations.value.filter(reservation =>
            [
                ReservationStatus.PENDING,
                ReservationStatus.CONFIRMED,
                ReservationStatus.ACTIVE
            ].includes(reservation.status)
        )
    );

    const reservationHistory = computed(() =>
        reservations.value.filter(reservation =>
            [
                ReservationStatus.COMPLETED,
                ReservationStatus.CANCELLED,
                ReservationStatus.EXPIRED
            ].includes(reservation.status)
        )
    );

    async function fetchFacilities() {
        facilitiesLoaded.value = false;

        try {
            const response = await reservationsApi.getFacilities();
            const fetchedFacilities =
                FacilityAssembler.toEntitiesFromResponse(response)
                    .filter(facility => facility.isActive);

            await Promise.all(
                fetchedFacilities.map(async facility => {
                    const spotsResponse =
                        await reservationsApi.getSpotsByFacilityId(facility.id);

                    facility.spots =
                        SpotAssembler.toEntitiesFromResponse(spotsResponse);
                })
            );

            facilities.value = fetchedFacilities;
            errors.value = [];
        } catch (error) {
            errors.value.push(error);
            facilities.value = [];
        } finally {
            facilitiesLoaded.value = true;
        }
    }

    async function fetchReservations(driverProfileId) {
        reservationsLoaded.value = false;

        try {
            const response =
                await reservationsApi
                    .getReservationsByDriverProfileId(driverProfileId);

            reservations.value =
                ReservationAssembler.toEntitiesFromResponse(response)
                    .sort((a, b) =>
                        new Date(b.startAt) - new Date(a.startAt)
                    );

            errors.value = [];
        } catch (error) {
            errors.value.push(error);
            reservations.value = [];
        } finally {
            reservationsLoaded.value = true;
        }
    }

    async function createReservation(command) {
        const profilesStore = useProfilesStore();

        const facility =
            facilities.value.find(item =>
                item.id === command.parkingFacilityId
            );

        const vehicle =
            profilesStore.vehicles.find(item =>
                item.id === command.vehicleId
            );

        if (!facility || !vehicle) {
            return outcome(false, 'failed');
        }

        try {
            const spotsResponse =
                await reservationsApi.getSpotsByFacilityId(facility.id);

            facility.spots =
                SpotAssembler.toEntitiesFromResponse(spotsResponse);

            const availableSpot =
                facility.spots.find(spot =>
                    spot.isAvailable && spot.type === vehicle.type
                );

            if (!availableSpot) {
                return outcome(false, 'no-availability');
            }

            const estimatedAmount = Number(
                (
                    Number(facility.hourlyRate) *
                    (Number(command.durationMinutes) / 60)
                ).toFixed(2)
            );

            const reservation = new Reservation({
                code: generateReservationCode(),
                driverProfileId: command.driverProfileId,
                vehicleId: command.vehicleId,
                parkingSpotId: availableSpot.id,
                startAt: command.startAt,
                durationMinutes: command.durationMinutes,
                estimatedAmount,
                currency: 'PEN',
                createdAt: new Date().toISOString()
            });

            reservation.confirm();

            availableSpot.reserve();

            await reservationsApi.updateSpot(
                availableSpot.id,
                SpotAssembler.toResourceFromEntity(availableSpot)
            );

            try {
                const response =
                    await reservationsApi.createReservation(
                        ReservationAssembler
                            .toResourceFromEntity(reservation)
                    );

                const created =
                    ReservationAssembler
                        .toEntityFromResource(response.data);

                reservations.value.unshift(created);
                errors.value = [];

                return outcome(true);
            } catch (error) {
                availableSpot.free();

                await reservationsApi.updateSpot(
                    availableSpot.id,
                    SpotAssembler.toResourceFromEntity(availableSpot)
                );

                throw error;
            }
        } catch (error) {
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function cancelReservation(reservationId) {
        const reservation =
            reservations.value.find(item =>
                item.id === reservationId
            );

        if (!reservation) {
            return outcome(false, 'failed');
        }

        if ([
            ReservationStatus.CANCELLED,
            ReservationStatus.COMPLETED,
            ReservationStatus.EXPIRED
        ].includes(reservation.status)) {
            return outcome(false, 'not-cancellable');
        }

        const previousStatus = reservation.status;

        reservation.cancel();

        try {
            await reservationsApi.updateReservation(
                reservation.id,
                ReservationAssembler.toResourceFromEntity(reservation)
            );

            const spotResponse =
                await reservationsApi.getSpotById(
                    reservation.parkingSpotId
                );

            const spot =
                SpotAssembler.toEntityFromResource(spotResponse.data);

            spot.free();

            await reservationsApi.updateSpot(
                spot.id,
                SpotAssembler.toResourceFromEntity(spot)
            );

            for (const facility of facilities.value) {
                const localSpot =
                    facility.spots.find(item =>
                        item.id === spot.id
                    );

                if (localSpot) {
                    localSpot.free();
                    break;
                }
            }

            errors.value = [];
            return outcome(true);
        } catch (error) {
            reservation.status = previousStatus;

            try {
                await reservationsApi.updateReservation(
                    reservation.id,
                    ReservationAssembler
                        .toResourceFromEntity(reservation)
                );
            } catch {
                // The original error is kept in the store.
            }

            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    function generateReservationCode() {
        return `EP-${Date.now().toString(36).toUpperCase()}`;
    }

    function clear() {
        reservations.value = [];
        facilities.value = [];
        reservationsLoaded.value = false;
        facilitiesLoaded.value = false;
        errors.value = [];
    }

    return {
        reservations,
        facilities,
        reservationsLoaded,
        facilitiesLoaded,
        errors,
        activeReservations,
        reservationHistory,
        fetchFacilities,
        fetchReservations,
        createReservation,
        cancelReservation,
        clear
    };
});

export default useReservationsStore;