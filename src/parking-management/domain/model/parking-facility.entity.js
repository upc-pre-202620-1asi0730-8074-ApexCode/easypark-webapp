import {FacilityStatus} from "./facility-status.js";

export class ParkingFacility {
    constructor({id = null, operatorProfileId, name, address, latitude = null, longitude = null, hourlyRate, openTime = '00:00', closeTime = '23:59', status = FacilityStatus.ACTIVE, createdAt, spots = []}) {
        this.id = id;
        this.operatorProfileId = operatorProfileId;
        this.name = name;
        this.address = address;
        this.latitude = latitude;
        this.longitude = longitude;
        this.hourlyRate = hourlyRate;
        this.openTime = openTime;
        this.closeTime = closeTime;
        this.status = status;
        this.createdAt = createdAt;
        this.spots = spots;
    }

    get totalSpots() {
        return this.spots.length;
    }

    get availableSpots() {
        return this.spots.filter(spot => spot.isAvailable).length;
    }

    get occupancyRate() {
        return this.totalSpots === 0 ? 0 : Math.round(((this.totalSpots - this.availableSpots) / this.totalSpots) * 100);
    }

    get isActive() {
        return this.status === FacilityStatus.ACTIVE;
    }

    addSpot(spot) {
        this.spots.push(spot);
    }

    updateDetails(name, address, hourlyRate, openTime, closeTime) {
        this.name = name;
        this.address = address;
        this.hourlyRate = hourlyRate;
        this.openTime = openTime;
        this.closeTime = closeTime;
    }

    activate() {
        this.status = FacilityStatus.ACTIVE;
    }

    deactivate() {
        this.status = FacilityStatus.INACTIVE;
    }

    setUnderMaintenance() {
        this.status = FacilityStatus.MAINTENANCE;
    }
}
