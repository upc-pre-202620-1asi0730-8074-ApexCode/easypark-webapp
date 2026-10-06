import {MovementType} from "./movement-type.js";
import {RegistrationMethod} from "./registration-method.js";

export class RegisterAccessCommand {
    constructor({
                    parkingFacilityId,
                    plateNumber,
                    type = MovementType.ENTRY,
                    registrationMethod = RegistrationMethod.MANUAL,
                    reservationCode = null,
                    operatorId = null
                }) {
        this.parkingFacilityId = parkingFacilityId;
        this.plateNumber = plateNumber;
        this.type = type;
        this.registrationMethod = registrationMethod;
        this.reservationCode = reservationCode || null;
        this.operatorId = operatorId;
    }
}