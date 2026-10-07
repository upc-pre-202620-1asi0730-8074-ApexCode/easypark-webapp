import {NotificationStatus} from "./notification-status.js";

/**
 * Message delivered to one recipient. Exactly one source foreign key is set
 * (reservation, parking stay or alert), the other two stay null, so two
 * evaluations of the same source are recognisable and never duplicate the
 * notification.
 */
export class Notification {
    constructor({
                    id = null,
                    recipientId,
                    notificationTemplateId = null,
                    reservationId = null,
                    parkingStayId = null,
                    alertId = null,
                    title,
                    message,
                    channel,
                    status = NotificationStatus.PENDING,
                    createdAt,
                    sentAt = null,
                    readAt = null
                }) {
        this.id = id;
        this.recipientId = recipientId;
        this.notificationTemplateId = notificationTemplateId;
        this.reservationId = reservationId;
        this.parkingStayId = parkingStayId;
        this.alertId = alertId;
        this.title = title;
        this.message = message;
        this.channel = channel;
        this.status = status;
        this.createdAt = createdAt;
        this.sentAt = sentAt;
        this.readAt = readAt;
    }

    /**
     * Unread means "not READ" on purpose: a PENDING row was never delivered
     * and a FAILED row was never confirmed, so both still owe the driver a
     * read interaction.
     */
    get isUnread() {
        return this.status !== NotificationStatus.READ;
    }

    get isRead() {
        return this.status === NotificationStatus.READ;
    }

    /**
     * Delivery of a PENDING notification (in-app delivery is immediate, an
     * email gateway calls it after the send attempt). Any other status keeps
     * its own timestamps, mirroring `Alert.resolve()`.
     */
    markAsSent(now = new Date()) {
        if (this.status !== NotificationStatus.PENDING) return false;

        this.status = NotificationStatus.SENT;
        this.sentAt = this.#toIso(now);

        return true;
    }

    /**
     * Reading an already read notification has no effect and keeps its
     * original `readAt`, mirroring `Alert.resolve()`.
     */
    markAsRead(now = new Date()) {
        if (this.isRead) return false;

        this.status = NotificationStatus.READ;
        this.readAt = this.#toIso(now);

        return true;
    }

    /**
     * Delivery failed (only a failing email gateway reaches this path in the
     * diagram; nothing in the mock calls it). `reason` is accepted for parity
     * with `MarkAsFailed(string reason)` but has no column in the ER, so it is
     * not persisted.
     */
    markAsFailed(reason = null) {
        if (this.status === NotificationStatus.FAILED) return false;

        this.status = NotificationStatus.FAILED;

        return true;
    }

    #toIso(value) {
        return value instanceof Date
            ? value.toISOString()
            : value;
    }
}
