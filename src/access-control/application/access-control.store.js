import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import {AccessControlApi} from '../infrastructure/access-control-api.js';
import {AccessMovementAssembler} from '../infrastructure/access-movement.assembler.js';
import {ParkingStayAssembler} from '../infrastructure/parking-stay.assembler.js';
import {FacilityAssembler} from '../../parking-management/infrastructure/facility.assembler.js';
import {SpotAssembler} from '../../parking-management/infrastructure/spot.assembler.js';
import {VehicleAssembler} from '../../profiles/infrastructure/vehicle.assembler.js';
import {PlateNumber} from '../../profiles/domain/model/plate-number.js';

const api = new AccessControlApi();
const outcome = (success, reason) => reason ? {success, reason} : {success};

const useAccessControlStore = defineStore('access-control', () => {
    const facilities = ref([]);
    const currentFacility = ref(null);
    const movements = ref([]);
    const stays = ref([]);
    const vehicles = ref([]);
    const facilitiesLoaded = ref(false);
    const accessDataLoaded = ref(false);
    const errors = ref([]);
    const spots = computed(() => currentFacility.value?.spots ?? []);
    const availableSpots = computed(() => spots.value.filter(spot => spot.isAvailable));
    const occupiedSpots = computed(() => spots.value.filter(spot => spot.status === 'OCCUPIED'));
    const activeStays = computed(() => stays.value.filter(stay => stay.isOpen));
    const occupancyRate = computed(() => spots.value.length ?
        Math.round(100 * occupiedSpots.value.length / spots.value.length) : 0);

    async function fetchFacilities(operatorProfileId) {
        facilitiesLoaded.value = false;
        try {
            const response = await api.getFacilitiesByOperatorProfileId(operatorProfileId);
            facilities.value = FacilityAssembler.toEntitiesFromResponse(response);
            errors.value = [];
        } catch (error) {
            facilities.value = [];
            errors.value.push(error);
        } finally {
            facilitiesLoaded.value = true;
        }
    }

    async function selectFacility(facilityId) {
        currentFacility.value = facilities.value.find(item => String(item.id) === String(facilityId)) ?? null;
        movements.value = [];
        stays.value = [];
        vehicles.value = [];
        if (!currentFacility.value) {
            accessDataLoaded.value = true;
            return;
        }
        accessDataLoaded.value = false;
        try {
            const [spotResult, movementResult, stayResult] = await Promise.all([
                api.getSpotsByFacilityId(facilityId),
                api.getAccessMovementsByFacilityId(facilityId),
                api.getParkingStaysByFacilityId(facilityId)
            ]);
            currentFacility.value.spots = SpotAssembler.toEntitiesFromResponse(spotResult);
            movements.value = AccessMovementAssembler.toEntitiesFromResponse(movementResult)
                .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));
            stays.value = ParkingStayAssembler.toEntitiesFromResponse(stayResult);

            // Los operadores no tienen permiso para GET /vehicles sin filtros.
            // Consultar por ID solamente los vehiculos asociados a movimientos propios.
            const rawMovements = movementResult.data ?? [];
            const ids = [...new Set(rawMovements.map(item => item.vehicleId).filter(Boolean))];
            const loaded = await Promise.allSettled(ids.map(id => api.getVehicleById(id)));
            vehicles.value = ids.map((id, index) => {
                const result = loaded[index];
                if (result.status === 'fulfilled') {
                    return VehicleAssembler.toEntityFromResource(result.value.data);
                }
                const movement = rawMovements.find(item => item.vehicleId === id);
                return {id, plateNumber: {value: movement?.plateNumber ?? 'â€”'}, type: null};
            });
            errors.value = [];
        } catch (error) {
            errors.value.push(error);
        } finally {
            accessDataLoaded.value = true;
        }
    }

    async function registerAccess(command) {
        const plateNumber = PlateNumber.normalize(command.plateNumber);
        if (!plateNumber) return outcome(false, 'invalid-plate-number');
        if (!facilities.value.some(item => item.id === command.parkingFacilityId)) {
            return outcome(false, 'failed');
        }
        try {
            const response = await api.createAccessMovement({
                parkingFacilityId: command.parkingFacilityId,
                plateNumber,
                movementType: command.type,
                registrationMethod: command.registrationMethod,
                reservationCode: command.reservationCode || null
            });
            // Status/importe/codigo/ocupacion se calculan y guardan SOLO en backend.
            const status = response.data?.status;
            const reason = response.data?.note ?? 'failed';
            await selectFacility(command.parkingFacilityId);
            if (status === 'UNDER_REVIEW') return outcome(true, 'under-review');
            if (status === 'REJECTED') return outcome(false, reason);
            if (status === 'COMPLETED') return outcome(true);
            return outcome(false, 'failed');
        } catch (error) {
            errors.value.push(error);
            return outcome(false, error?.response?.data?.code ?? 'failed');
        }
    }

    async function reassignStay(command) {
        try {
            await api.updateParkingStay(command.parkingStayId, {parkingSpotId: command.parkingSpotId});
            if (currentFacility.value) await selectFacility(currentFacility.value.id);
            errors.value = [];
            return outcome(true);
        } catch (error) {
            errors.value.push(error);
            return outcome(false, error?.response?.data?.code ?? 'failed');
        }
    }
    function vehicleById(id) { return vehicles.value.find(item => item.id === id) ?? null; }
    function movementById(id) { return movements.value.find(item => item.id === id) ?? null; }
    function spotById(id) { return spots.value.find(item => item.id === id) ?? null; }
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
    return {facilities, currentFacility, movements, stays, vehicles,
        facilitiesLoaded, accessDataLoaded, errors, spots, availableSpots,
        occupiedSpots, activeStays, occupancyRate, fetchFacilities,
        selectFacility, registerAccess, reassignStay, vehicleById, movementById,
        spotById, clear};
});
export default useAccessControlStore;
