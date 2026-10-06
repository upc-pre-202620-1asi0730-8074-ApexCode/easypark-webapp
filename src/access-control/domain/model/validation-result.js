export class ValidationResult {
    constructor({
                    isApproved = false,
                    reason = null,
                    vehicleId = null,
                    reservationId = null
                }) {
        this.isApproved = Boolean(isApproved);
        this.reason = reason;
        this.vehicleId = vehicleId;
        this.reservationId = reservationId;
    }
}