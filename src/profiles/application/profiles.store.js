import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {ProfilesApi} from "../infrastructure/profiles-api.js";
import {ProfileAssembler} from "../infrastructure/profile.assembler.js";
import {VehicleAssembler} from "../infrastructure/vehicle.assembler.js";
import {DriverProfile} from "../domain/model/driver-profile.entity.js";
import {OperatorProfile} from "../domain/model/operator-profile.entity.js";
import {Vehicle} from "../domain/model/vehicle.entity.js";
import {PlateNumber} from "../domain/model/plate-number.js";

const profilesApi = new ProfilesApi();

function outcome(success, reason) {
    return reason ? {success, reason} : {success};
}

const useProfilesStore = defineStore('profiles', () => {
    const currentProfile = ref(null);
    const loadedUserAccountId = ref(null);
    const profileLoaded = ref(false);
    const errors = ref([]);
    const isDriverProfile = computed(() => currentProfile.value instanceof DriverProfile);
    const vehicles = computed(() => isDriverProfile.value ? currentProfile.value.vehicles : []);

    async function fetchProfile(userAccountId, isOperator) {
        loadedUserAccountId.value = userAccountId;
        profileLoaded.value = false;
        try {
            const response = await profilesApi.getProfilesByUserAccountId(userAccountId);
            const profile = ProfileAssembler.toEntityFromCollectionResponse(response, isOperator);
            if (profile instanceof DriverProfile) {
                const vehiclesResponse = await profilesApi.getVehiclesByProfileId(profile.id);
                profile.vehicles = VehicleAssembler.toEntitiesFromResponse(vehiclesResponse);
            }
            if (loadedUserAccountId.value !== userAccountId) return;
            currentProfile.value = profile;
            errors.value = [];
        } catch (error) {
            errors.value.push(error);
            currentProfile.value = null;
        } finally {
            if (loadedUserAccountId.value === userAccountId) profileLoaded.value = true;
        }
    }

    async function createProfile(command, isOperator) {
        const attributes = {
            userAccountId: command.userAccountId,
            firstName: command.firstName,
            lastName: command.lastName,
            phone: command.phone,
            createdAt: new Date().toISOString()
        };
        const profile = isOperator
            ? new OperatorProfile({ ...attributes, companyName: command.companyName, jobTitle: command.jobTitle })
            : new DriverProfile(attributes);
        try {
            const response = await profilesApi.createProfile(ProfileAssembler.toResourceFromEntity(profile));
            currentProfile.value = ProfileAssembler.toEntityFromResource(response.data, isOperator);
            loadedUserAccountId.value = command.userAccountId;
            profileLoaded.value = true;
            errors.value = [];
            return outcome(true);
        } catch (error) {
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function updateProfile(command) {
        const profile = currentProfile.value;
        if (!profile) return outcome(false, 'failed');
        const previous = ProfileAssembler.toResourceFromEntity(profile);
        profile.updateName(command.firstName, command.lastName);
        profile.updatePhone(command.phone);
        if (profile instanceof OperatorProfile) profile.updateEmployment(command.companyName, command.jobTitle);
        try {
            await profilesApi.updateProfile(profile.id, ProfileAssembler.toResourceFromEntity(profile));
            errors.value = [];
            return outcome(true);
        } catch (error) {
            Object.assign(profile, previous);
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    /**
     * Registra un vehículo del conductor. Si la placa ya existe sin propietario (leída en un punto de control), se le asigna en lugar de duplicarla.
     */
    async function registerVehicle(command) {
        const profile = currentProfile.value;
        if (!(profile instanceof DriverProfile)) return outcome(false, 'failed');
        if (!PlateNumber.isValid(command.plateNumber)) return outcome(false, 'invalid-plate-number');
        const plateNumber = new PlateNumber(command.plateNumber);
        if (profile.ownsPlate(plateNumber)) return outcome(false, 'plate-already-yours');
        try {
            const existingResponse = await profilesApi.getVehiclesByPlateNumber(plateNumber.value);
            const [existing] = VehicleAssembler.toEntitiesFromResponse(existingResponse);
            if (existing?.hasOwner) return outcome(false, 'plate-taken');
            const vehicle = existing ?? new Vehicle({ plateNumber, createdAt: new Date().toISOString() });
            vehicle.assignOwner(profile.id);
            vehicle.updateData(command.type, command.color || null);
            vehicle.isDefault = profile.vehicles.length === 0;
            const resource = VehicleAssembler.toResourceFromEntity(vehicle);
            const response = existing
                ? await profilesApi.updateVehicle(existing.id, resource)
                : await profilesApi.createVehicle(resource);
            profile.addVehicle(VehicleAssembler.toEntityFromResource(response.data));
            errors.value = [];
            return outcome(true);
        } catch (error) {
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function updateVehicle(command) {
        const vehicle = vehicles.value.find(item => item.id === command.vehicleId);
        if (!vehicle) return outcome(false, 'failed');
        const previous = { type: vehicle.type, color: vehicle.color };
        vehicle.updateData(command.type, command.color || null);
        try {
            await profilesApi.updateVehicle(vehicle.id, VehicleAssembler.toResourceFromEntity(vehicle));
            errors.value = [];
            return outcome(true);
        } catch (error) {
            vehicle.updateData(previous.type, previous.color);
            errors.value.push(error);
            return outcome(false, 'failed');
        }
    }

    async function setDefaultVehicle(vehicleId) {
        const profile = currentProfile.value;
        if (!(profile instanceof DriverProfile)) return outcome(false, 'failed');
        const changed = profile.setDefaultVehicle(vehicleId);
        return persistVehicles(changed);
    }

    async function removeVehicle(vehicleId) {
        const profile = currentProfile.value;
        if (!(profile instanceof DriverProfile)) return outcome(false, 'failed');
        const { removed, changed } = profile.removeVehicle(vehicleId);
        if (!removed) return outcome(false, 'failed');
        return persistVehicles([removed, ...changed]);
    }

    /**
     * Persiste los vehículos modificados; si la API rechaza el cambio, recarga el perfil para no mostrar un estado que no fue aceptado.
     */
    async function persistVehicles(changedVehicles) {
        try {
            await Promise.all(changedVehicles.map(vehicle =>
                profilesApi.updateVehicle(vehicle.id, VehicleAssembler.toResourceFromEntity(vehicle))));
            errors.value = [];
            return outcome(true);
        } catch (error) {
            errors.value.push(error);
            await fetchProfile(loadedUserAccountId.value, false);
            return outcome(false, 'failed');
        }
    }

    function clear() {
        currentProfile.value = null;
        loadedUserAccountId.value = null;
        profileLoaded.value = false;
        errors.value = [];
    }

    return {
        currentProfile,
        loadedUserAccountId,
        profileLoaded,
        errors,
        isDriverProfile,
        vehicles,
        fetchProfile,
        createProfile,
        updateProfile,
        registerVehicle,
        updateVehicle,
        setDefaultVehicle,
        removeVehicle,
        clear
    };
});

export default useProfilesStore;
