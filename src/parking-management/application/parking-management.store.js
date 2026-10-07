import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {ParkingManagementApi} from "../infrastructure/parking-management-api.js";
import {FacilityAssembler} from "../infrastructure/facility.assembler.js";
import {SpotAssembler} from "../infrastructure/spot.assembler.js";
import {ParkingFacility} from "../domain/model/parking-facility.entity.js";
import {ParkingSpot} from "../domain/model/parking-spot.entity.js";

const parkingManagementApi = new ParkingManagementApi();

function outcome(success, reason) {
    return reason ? {success, reason} : {success};
}

const useParkingManagementStore = defineStore('parking-management', () => {
    const facilities = ref([]);
    const currentFacility = ref(null);
    const loadedOperatorProfileId = ref(null);
    const facilitiesLoaded = ref(false);
    const spotsLoaded = ref(false);
    const errors = ref([]);

    const spots = computed(() => currentFacility.value?.spots ?? []);

    async function fetchFacilities(operatorProfileId) {
        loadedOperatorProfileId.value = operatorProfileId;
        facilitiesLoaded.value = false;
        try {
            const response = await parkingManagementApi.getFacilitiesByOperatorProfileId(operatorProfileId);
            const fetched = FacilityAssembler.toEntitiesFromResponse(response);
            if (loadedOperatorProfileId.value !== operatorProfileId) return;
            facilities.value = fetched;
            errors.value = [];
        } catch (error) {
            errors.value.push(error);
            facilities.value = [];
        } finally {
            if (loadedOperatorProfileId.value === operatorProfileId) facilitiesLoaded.value = true;
        }
    }

    async function selectFacility(facilityId) {
        const facility = facilities.value.find(item => item.id === facilityId);
        currentFacility.value = facility ?? null;
        if (!facility) {
            spotsLoaded.value = true;
            return;
        }
        spotsLoaded.value = false;
        try {
            const response = await parkingManagementApi.getSpotsByFacilityId(facilityId);
            facility.spots = SpotAssembler.toEntitiesFromResponse(response);
            errors.value = [];
        } catch (error) {
            errors.value.push(error);
            facility.spots = [];
        } finally {
            spotsLoaded.value = true;
        }
    }

    function clearSelection() {
        currentFacility.value = null;
        spotsLoaded.value = false;
    }

    async function createFacility(command) {
        const facility = new ParkingFacility({...command, createdAt: new Date().toISOString()});
        try {
            const response = await parkingManagementApi.createFacility(FacilityAssembler.toResourceFromEntity(facility));
            const created = FacilityAssembler.toEntityFromResource(response.data);
            facilities.value.push(created);
            errors.value = [];
            return outcome(true);
        } catch (error) {
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function updateFacility(command) {
        const facility = currentFacility.value;
        if (!facility) return outcome(false, 'failed');
        const previous = FacilityAssembler.toResourceFromEntity(facility);
        facility.updateDetails(command.name, command.address, command.hourlyRate, command.openTime, command.closeTime);
        try {
            await parkingManagementApi.updateFacility(facility.id, FacilityAssembler.toResourceFromEntity(facility));
            errors.value = [];
            return outcome(true);
        } catch (error) {
            Object.assign(facility, previous);
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function createSpot(command) {
        const facility = currentFacility.value;
        if (!facility) return outcome(false, 'failed');
        if (facility.spots.some(spot => spot.code === command.code)) return outcome(false, 'code-taken');
        const spot = new ParkingSpot({
            facilityId: facility.id,
            code: command.code,
            level: command.level,
            type: command.type,
            createdAt: new Date().toISOString()
        });
        try {
            const response = await parkingManagementApi.createSpot(SpotAssembler.toResourceFromEntity(spot));
            facility.addSpot(SpotAssembler.toEntityFromResource(response.data));
            errors.value = [];
            return outcome(true);
        } catch (error) {
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function updateSpot(command) {
        const spot = spots.value.find(item => item.id === command.spotId);
        if (!spot) return outcome(false, 'failed');
        if (spots.value.some(item => item.id !== spot.id && item.code === command.code)) return outcome(false, 'code-taken');
        const previous = {code: spot.code, level: spot.level, type: spot.type};
        spot.updateDetails(command.code, command.level, command.type);
        try {
            await parkingManagementApi.updateSpot(spot.id, SpotAssembler.toResourceFromEntity(spot));
            errors.value = [];
            return outcome(true);
        } catch (error) {
            spot.updateDetails(previous.code, previous.level, previous.type);
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function changeSpotStatus(spotId, transition) {
        const spot = spots.value.find(item => item.id === spotId);
        if (!spot) return outcome(false, 'failed');
        const previousStatus = spot.status;
        spot[transition]();
        try {
            await parkingManagementApi.updateSpot(spot.id, SpotAssembler.toResourceFromEntity(spot));
            errors.value = [];
            return outcome(true);
        } catch (error) {
            spot.status = previousStatus;
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    function clear() {
        facilities.value = [];
        currentFacility.value = null;
        loadedOperatorProfileId.value = null;
        facilitiesLoaded.value = false;
        spotsLoaded.value = false;
        errors.value = [];
    }

    return {
        facilities,
        currentFacility,
        facilitiesLoaded,
        spotsLoaded,
        errors,
        spots,
        fetchFacilities,
        selectFacility,
        clearSelection,
        createFacility,
        updateFacility,
        createSpot,
        updateSpot,
        changeSpotStatus,
        clear
    };
});

export default useParkingManagementStore;
