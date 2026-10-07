
import {FacilityStatus} from './facility-status.js';
import {SpotStatus} from './spot-status.js';

export class ParkingFacility {
    constructor({
                    id = null,
                    operatorProfileId,
                    name,
                    address,
                    latitude = null,
                    longitude = null,
                    hourlyRate,
                    openTime = '00:00',
                    closeTime = '23:59',
                    status = FacilityStatus.ACTIVE,
                    createdAt,
                    spots = []
                }) {
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
        return this.spots.filter(
            spot => spot.status === SpotStatus.AVAILABLE
        ).length;
    }

    get occupiedSpots() {
        return this.spots.filter(
            spot => spot.status === SpotStatus.OCCUPIED
        ).length;
    }

    get reservedSpots() {
        return this.spots.filter(
            spot => spot.status === SpotStatus.RESERVED
        ).length;
    }

    get maintenanceSpots() {
        return this.spots.filter(
            spot => spot.status === SpotStatus.OUT_OF_SERVICE
        ).length;
    }

    get occupancyRate() {
        if (this.totalSpots === 0) return 0;

        return Math.round(
            this.occupiedSpots / this.totalSpots * 100
        );
    }

    get isActive() {
        return this.status === FacilityStatus.ACTIVE;
    }

    get isFull() {
        return this.isActive &&
            this.totalSpots > 0 &&
            this.availableSpots === 0;
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
