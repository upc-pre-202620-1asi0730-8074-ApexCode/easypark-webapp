import {MovementType} from "./movement-type.js";
import {RegistrationMethod} from "./registration-method.js";
import {MovementStatus} from "./movement-status.js";

export class AccessMovement {
    constructor({
                    id = null,
                    parkingFacilityId,
                    vehicleId,
                    operatorId = null,
                    type = MovementType.ENTRY,
                    registrationMethod = RegistrationMethod.MANUAL,
                    status = MovementStatus.IN_PROGRESS,
                    occurredAt,
                    note = null
                }) {
        this.id = id;
        this.parkingFacilityId = parkingFacilityId;
        this.vehicleId = vehicleId;
        this.operatorId = operatorId;
        this.type = type;
        this.registrationMethod = registrationMethod;
        this.status = status;
        this.occurredAt = occurredAt;
        this.note = note;
    }

    get isEntry() {
        return this.type === MovementType.ENTRY;
    }

    get isExit() {
        return this.type === MovementType.EXIT;
    }

    complete() {
        this.status = MovementStatus.COMPLETED;
        this.note = null;
    }

    sendToReview(note = null) {
        this.status = MovementStatus.UNDER_REVIEW;
        this.note = note;
    }

    reject(note = null) {
        this.status = MovementStatus.REJECTED;
        this.note = note;
    }
}