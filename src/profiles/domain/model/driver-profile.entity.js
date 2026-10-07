import {Profile} from "./profile.entity.js";

export class DriverProfile extends Profile {
    constructor({vehicles = [], ...params}) {
        super(params);
        this.vehicles = vehicles;
    }

    get defaultVehicle() {
        return this.vehicles.find(vehicle => vehicle.isDefault) ?? null;
    }

    ownsPlate(plateNumber) {
        return this.vehicles.some(vehicle => vehicle.plateNumber.equals(plateNumber));
    }

    /**
     * Agrega un vehículo al conductor; el primero que se registra queda como predeterminado.
     */
    addVehicle(vehicle) {
        vehicle.isDefault = this.vehicles.length === 0;
        this.vehicles.push(vehicle);
    }

    setDefaultVehicle(vehicleId) {
        const changed = [];
        for (const vehicle of this.vehicles) {
            const shouldBeDefault = vehicle.id === vehicleId;
            if (vehicle.isDefault !== shouldBeDefault) {
                vehicle.isDefault = shouldBeDefault;
                changed.push(vehicle);
            }
        }
        return changed;
    }

    /**
     * Quita un vehículo y, si era el predeterminado, promueve al siguiente. La placa queda sin propietario porque las reservas y accesos pasados la referencian.
     */
    removeVehicle(vehicleId) {
        const index = this.vehicles.findIndex(vehicle => vehicle.id === vehicleId);
        if (index < 0) return { removed: null, changed: [] };
        const [removed] = this.vehicles.splice(index, 1);
        const wasDefault = removed.isDefault;
        removed.releaseOwner();
        const changed = wasDefault && this.vehicles.length ? this.setDefaultVehicle(this.vehicles[0].id) : [];
        return { removed, changed };
    }
}
