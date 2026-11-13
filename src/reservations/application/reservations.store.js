import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import {ReservationsApi} from '../infrastructure/reservations-api.js';
import {ReservationAssembler} from '../infrastructure/reservation.assembler.js';
import {ReservationStatus} from '../domain/model/reservation-status.js';
import {FacilityAssembler} from '../../parking-management/infrastructure/facility.assembler.js';
import {SpotAssembler} from '../../parking-management/infrastructure/spot.assembler.js';

const api = new ReservationsApi();
const outcome = (success, reason) => reason ? {success, reason} : {success};
const reasonFrom = (error) => error?.response?.data?.code ||
    (error?.response?.status === 409 ? 'no-availability' : 'failed');

const useReservationsStore = defineStore('reservations', () => {
    const reservations = ref([]);
    const facilities = ref([]);
    const reservationsLoaded = ref(false);
    const facilitiesLoaded = ref(false);
    const errors = ref([]);

    const activeReservations = computed(() => reservations.value.filter(item =>
        [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.ACTIVE].includes(item.status)));
    const reservationHistory = computed(() => reservations.value.filter(item =>
        [ReservationStatus.COMPLETED, ReservationStatus.CANCELLED, ReservationStatus.EXPIRED].includes(item.status)));

    async function fetchFacilities() {
        facilitiesLoaded.value = false;
        try {
            const response = await api.getFacilities();
            const loaded = FacilityAssembler.toEntitiesFromResponse(response).filter(item => item.isActive);
            await Promise.all(loaded.map(async facility => {
                const spots = await api.getSpotsByFacilityId(facility.id);
                facility.spots = SpotAssembler.toEntitiesFromResponse(spots);
            }));
            facilities.value = loaded;
            errors.value = [];
        } catch (error) {
            facilities.value = [];
            errors.value.push(error);
        } finally {
            facilitiesLoaded.value = true;
        }
    }

    async function fetchReservations(driverProfileId) {
        reservationsLoaded.value = false;
        try {
            const response = await api.getReservationsByDriverProfileId(driverProfileId);
            reservations.value = ReservationAssembler.toEntitiesFromResponse(response)
                .sort((a, b) => new Date(b.startAt) - new Date(a.startAt));
            errors.value = [];
        } catch (error) {
            reservations.value = [];
            errors.value.push(error);
        } finally {
            reservationsLoaded.value = true;
        }
    }

    async function createReservation(command) {
        try {
            // No hay PUT de parking-spots desde el conductor, ni calculos o codigos locales.
            const response = await api.createReservation({
                vehicleId: command.vehicleId,
                parkingFacilityId: command.parkingFacilityId,
                startAt: command.startAt,
                durationMinutes: command.durationMinutes
            });
            const created = ReservationAssembler.toEntityFromResource(response.data);
            reservations.value.unshift(created);
            errors.value = [];
            // Consulta posterior del API: si falla, la reserva YA existe en MySQL.
            try { await fetchFacilities(); } catch { /* el POST ya fue exitoso */ }
            return outcome(true);
        } catch (error) {
            errors.value.push(error);
            return outcome(false, reasonFrom(error));
        }
    }

    async function cancelReservation(id) {
        const current = reservations.value.find(item => item.id === id);
        if (!current) return outcome(false, 'failed');
        if ([ReservationStatus.CANCELLED, ReservationStatus.COMPLETED, ReservationStatus.EXPIRED].includes(current.status)) {
            return outcome(false, 'not-cancellable');
        }
        try {
            // El backend libera el espacio en la MISMA operacion.
            const response = await api.updateReservation(id, {status: ReservationStatus.CANCELLED});
            const idx = reservations.value.findIndex(item => item.id === id);
            if (idx >= 0) reservations.value[idx] = ReservationAssembler.toEntityFromResource(response.data);
            errors.value = [];
            try { await fetchFacilities(); } catch { /* ya se cancelo */ }
            return outcome(true);
        } catch (error) {
            errors.value.push(error);
            return outcome(false, error?.response?.data?.code ?? 'failed');
        }
    }

    function clear() {
        reservations.value = [];
        facilities.value = [];
        reservationsLoaded.value = false;
        facilitiesLoaded.value = false;
        errors.value = [];
    }
    return {reservations, facilities, reservationsLoaded, facilitiesLoaded, errors,
        activeReservations, reservationHistory, fetchFacilities, fetchReservations,
        createReservation, cancelReservation, clear};
});
export default useReservationsStore;
