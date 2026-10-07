
export class NotificationPayload {
    constructor({
                    recipientId,
                    reservationId = null,
                    parkingStayId = null,
                    alertId = null,
                    zoneName = null,
                    spaceCode = null,
                    plateNumber = null,
                    scheduledFor = null
                }) {
        this.recipientId = recipientId;
        this.reservationId = reservationId;
        this.parkingStayId = parkingStayId;
        this.alertId = alertId;
        this.zoneName = zoneName;
        this.spaceCode = spaceCode;
        this.plateNumber = plateNumber;
        this.scheduledFor = scheduledFor;
    }
}
