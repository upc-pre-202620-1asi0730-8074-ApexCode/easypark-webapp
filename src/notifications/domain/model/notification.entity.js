import {NotificationStatus} from "./notification-status.js";

function toIso(value) {
    return value instanceof Date
        ? value.toISOString()
        : value;
}

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


    get isUnread() {
        return this.status !== NotificationStatus.READ;
    }

    get isRead() {
        return this.status === NotificationStatus.READ;
    }


    markAsSent(now = new Date()) {
        if (this.status !== NotificationStatus.PENDING) return false;

        this.status = NotificationStatus.SENT;
        this.sentAt = toIso(now);

        return true;
    }

    markAsRead(now = new Date()) {
        if (this.isRead) return false;

        this.status = NotificationStatus.READ;
        this.readAt = toIso(now);

        return true;
    }


    markAsFailed(reason = null) {
        if (this.status === NotificationStatus.FAILED) return false;

        this.status = NotificationStatus.FAILED;

        return true;
    }
}