
import {defineStore} from 'pinia';
import {computed, ref} from 'vue';
import {ParkingManagementApi} from '../infrastructure/parking-management-api.js';
import {FacilityAssembler} from '../infrastructure/facility.assembler.js';
import {SpotAssembler} from '../infrastructure/spot.assembler.js';
import {ParkingFacility} from '../domain/model/parking-facility.entity.js';
import {ParkingSpot} from '../domain/model/parking-spot.entity.js';
import {SpotStatus} from '../domain/model/spot-status.js';

const api = new ParkingManagementApi();

const sameId = (a, b) =>
    a != null && b != null && String(a) === String(b);

const outcome = (success, reason = null) =>
    reason ? {success, reason} : {success};

const allowedTransitions = {
    occupy: [SpotStatus.AVAILABLE],
    reserve: [SpotStatus.AVAILABLE],
    free: [SpotStatus.OCCUPIED, SpotStatus.RESERVED],
    markOutOfService: [SpotStatus.AVAILABLE],
    returnToService: [SpotStatus.OUT_OF_SERVICE]
};

const useParkingManagementStore = defineStore('parking-management', () => {
    const facilities = ref([]);
    const currentFacility = ref(null);
    const loadedOperatorProfileId = ref(null);
    const facilitiesLoaded = ref(false);
    const spotsLoaded = ref(false);
    const errors = ref([]);

    let facilitiesRequestId = 0;
    let selectionRequestId = 0;

    const spots = computed(() => currentFacility.value?.spots ?? []);

    function findFacility(id) {
        return facilities.value.find(facility => sameId(facility.id, id)) ?? null;
    }

    async function fetchFacilities(operatorProfileId) {
        const requestId = ++facilitiesRequestId;
        ++selectionRequestId;

        const previousFacilityId = currentFacility.value?.id;

        loadedOperatorProfileId.value = operatorProfileId;
        facilitiesLoaded.value = false;
        spotsLoaded.value = false;
        errors.value = [];

        if (operatorProfileId == null) {
            facilities.value = [];
            currentFacility.value = null;
            facilitiesLoaded.value = true;
            spotsLoaded.value = true;
            return;
        }

        try {
            const response = await api.getFacilitiesByOperatorProfileId(operatorProfileId);
            const loaded = FacilityAssembler.toEntitiesFromResponse(response);

            if (requestId !== facilitiesRequestId) return;

            facilities.value = loaded;
            currentFacility.value = loaded.find(
                facility => sameId(facility.id, previousFacilityId)
            ) ?? loaded[0] ?? null;

            facilitiesLoaded.value = true;
            spotsLoaded.value = loaded.length === 0;

            const results = await Promise.allSettled(loaded.map(async facility => {
                const spotsResponse = await api.getSpotsByFacilityId(facility.id);
                return SpotAssembler.toEntitiesFromResponse(spotsResponse);
            }));

            if (requestId !== facilitiesRequestId) return;

            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    loaded[index].spots = result.value;
                } else {
                    errors.value.push(result.reason);
                }
            });
        } catch (error) {
            if (requestId !== facilitiesRequestId) return;
            errors.value.push(error);
            facilities.value = [];
            currentFacility.value = null;
        } finally {
            if (requestId === facilitiesRequestId) {
                facilitiesLoaded.value = true;
                spotsLoaded.value = true;
            }
        }
    }

    async function selectFacility(facilityId, refresh = false) {
        const requestId = ++selectionRequestId;
        const facility = findFacility(facilityId);

        currentFacility.value = facility;

        if (!facility) {
            spotsLoaded.value = true;
            return;
        }

        if (!refresh) {
            spotsLoaded.value = true;
            return;
        }

        spotsLoaded.value = false;

        try {
            const response = await api.getSpotsByFacilityId(facility.id);

            if (requestId !== selectionRequestId) return;

            facility.spots = SpotAssembler.toEntitiesFromResponse(response);
            errors.value = [];
        } catch (error) {
            if (requestId === selectionRequestId) {
                errors.value.push(error);
            }
        } finally {
            if (requestId === selectionRequestId) {
                spotsLoaded.value = true;
            }
        }
    }

    function clearSelection() {
        ++selectionRequestId;
        currentFacility.value = null;
        spotsLoaded.value = true;
    }

    async function createFacility(command) {
        if (command.operatorProfileId == null) {
            return outcome(false, 'failed');
        }

        const facility = new ParkingFacility({
            ...command,
            createdAt: new Date().toISOString()
        });

        try {
            const response = await api.createFacility(
                FacilityAssembler.toResourceFromEntity(facility)
            );

            const created = FacilityAssembler.toEntityFromResource(response.data);

            if (created.id == null) {
                throw new Error('Invalid facility identifier');
            }

            facilities.value.push(created);
            currentFacility.value = created;
            spotsLoaded.value = true;
            errors.value = [];

            return outcome(true);
        } catch (error) {
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function updateFacility(command, facilityId = currentFacility.value?.id) {
        const facility = findFacility(facilityId);

        if (!facility) return outcome(false, 'failed');

        const previous = {
            name: facility.name,
            address: facility.address,
            hourlyRate: facility.hourlyRate,
            openTime: facility.openTime,
            closeTime: facility.closeTime
        };

        facility.updateDetails(
            command.name,
            command.address,
            command.hourlyRate,
            command.openTime,
            command.closeTime
        );

        try {
            await api.updateFacility(
                facility.id,
                FacilityAssembler.toResourceFromEntity(facility)
            );

            errors.value = [];
            return outcome(true);
        } catch (error) {
            facility.updateDetails(
                previous.name,
                previous.address,
                previous.hourlyRate,
                previous.openTime,
                previous.closeTime
            );

            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function deleteFacility(facilityId) {
        const facility = findFacility(facilityId);

        if (!facility) return outcome(false, 'failed');

        if (facility.spots.length > 0) {
            return outcome(false, 'zone-not-empty');
        }

        try {
            await api.deleteFacility(facility.id);

            facilities.value = facilities.value.filter(
                item => !sameId(item.id, facility.id)
            );

            if (sameId(currentFacility.value?.id, facility.id)) {
                currentFacility.value = facilities.value[0] ?? null;
            }

            errors.value = [];
            return outcome(true);
        } catch (error) {
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function createSpot(command) {
        const facility = currentFacility.value;

        if (!facility) return outcome(false, 'failed');

        if (facility.spots.some(spot =>
            spot.code.toUpperCase() === command.code.toUpperCase()
        )) {
            return outcome(false, 'code-taken');
        }

        const spot = new ParkingSpot({
            facilityId: facility.id,
            code: command.code,
            level: command.level,
            type: command.type,
            createdAt: new Date().toISOString()
        });

        try {
            const response = await api.createSpot(
                SpotAssembler.toResourceFromEntity(spot)
            );

            facility.addSpot(SpotAssembler.toEntityFromResource(response.data));
            errors.value = [];

            return outcome(true);
        } catch (error) {
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function updateSpot(command) {
        const spot = spots.value.find(item => sameId(item.id, command.spotId));

        if (!spot) return outcome(false, 'failed');

        if (spots.value.some(item =>
            !sameId(item.id, spot.id) &&
            item.code.toUpperCase() === command.code.toUpperCase()
        )) {
            return outcome(false, 'code-taken');
        }

        const previous = {
            code: spot.code,
            level: spot.level,
            type: spot.type
        };

        spot.updateDetails(command.code, command.level, command.type);

        try {
            await api.updateSpot(
                spot.id,
                SpotAssembler.toResourceFromEntity(spot)
            );

            errors.value = [];
            return outcome(true);
        } catch (error) {
            spot.updateDetails(
                previous.code,
                previous.level,
                previous.type
            );

            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function changeSpotStatus(spotId, transition) {
        const spot = spots.value.find(item => sameId(item.id, spotId));

        if (!spot || !allowedTransitions[transition]?.includes(spot.status)) {
            return outcome(false, 'invalid-transition');
        }

        const previousStatus = spot.status;
        spot[transition]();

        try {
            await api.updateSpot(
                spot.id,
                SpotAssembler.toResourceFromEntity(spot)
            );

            errors.value = [];
            return outcome(true);
        } catch (error) {
            spot.status = previousStatus;
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function deleteSpot(spotId) {
        const facility = currentFacility.value;
        const spot = spots.value.find(item => sameId(item.id, spotId));

        if (!facility || !spot) return outcome(false, 'failed');

        if (![SpotStatus.AVAILABLE, SpotStatus.OUT_OF_SERVICE].includes(spot.status)) {
            return outcome(false, 'spot-in-use');
        }

        try {
            const [reservationsResponse, staysResponse] = await Promise.all([
                api.getReservations(),
                api.getParkingStays()
            ]);

            const linkedReservation = reservationsResponse.data.some(
                reservation => sameId(reservation.parkingSpotId, spot.id)
            );

            const linkedStay = staysResponse.data.some(
                stay => sameId(stay.parkingSpotId, spot.id)
            );

            if (linkedReservation || linkedStay) {
                return outcome(false, 'linked-records');
            }

            await api.deleteSpot(spot.id);

            facility.spots = facility.spots.filter(
                item => !sameId(item.id, spot.id)
            );

            errors.value = [];
            return outcome(true);
        } catch (error) {
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    function clear() {
        ++facilitiesRequestId;
        ++selectionRequestId;
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
        loadedOperatorProfileId,
        facilitiesLoaded,
        spotsLoaded,
        errors,
        spots,
        findFacility,
        fetchFacilities,
        selectFacility,
        clearSelection,
        createFacility,
        updateFacility,
        deleteFacility,
        createSpot,
        updateSpot,
        changeSpotStatus,
        deleteSpot,
        clear
    };
});

export default useParkingManagementStore;
