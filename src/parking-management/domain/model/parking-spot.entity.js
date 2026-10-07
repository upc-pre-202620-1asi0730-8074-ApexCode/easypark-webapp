import {SpotStatus} from "./spot-status.js";
import {SpotType} from "./spot-type.js";

export class ParkingSpot {
    constructor({id = null, facilityId, code, level = 1, type = SpotType.CAR, status = SpotStatus.AVAILABLE, createdAt}) {
        this.id = id;
        this.facilityId = facilityId;
        this.code = code;
        this.level = level;
        this.type = type;
        this.status = status;
        this.createdAt = createdAt;
    }

    get isAvailable() {
        return this.status === SpotStatus.AVAILABLE;
    }

    get isOutOfService() {
        return this.status === SpotStatus.OUT_OF_SERVICE;
    }

    updateDetails(code, level, type) {
        this.code = code;
        this.level = level;
        this.type = type;
    }

    occupy() {
        this.status = SpotStatus.OCCUPIED;
    }

    reserve() {
        this.status = SpotStatus.RESERVED;
    }

    free() {
        this.status = SpotStatus.AVAILABLE;
    }

    markOutOfService() {
        this.status = SpotStatus.OUT_OF_SERVICE;
    }

    returnToService() {
        this.status = SpotStatus.AVAILABLE;
    }
}
