/**
 * Values a notification template can interpolate. Exactly the eight fields of
 * the `NotificationPayload` element in the class diagram: the four foreign
 * keys plus the display values the mockup copy needs. Nothing else belongs
 * here (`minutesRemaining`, `durationMinutes` and friends are deliberately
 * absent) because a template must never depend on a value the diagram does not
 * guarantee.
 */
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
