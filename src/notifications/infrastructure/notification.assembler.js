import {Notification} from "../domain/model/notification.entity.js";

export class NotificationAssembler {
    static toEntityFromResource(resource) {
        return new Notification({
            id: resource.id,
            recipientId: resource.recipientId,
            notificationTemplateId: resource.notificationTemplateId ?? null,
            reservationId: resource.reservationId ?? null,
            parkingStayId: resource.parkingStayId ?? null,
            alertId: resource.alertId ?? null,
            title: resource.title,
            message: resource.message,
            channel: resource.channel,
            status: resource.status,
            createdAt: resource.createdAt,
            sentAt: resource.sentAt ?? null,
            readAt: resource.readAt ?? null
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        return response.data.map(resource =>
            this.toEntityFromResource(resource)
        );
    }

    static toResourceFromEntity(notification) {
        return {
            ...(notification.id !== null ? {id: notification.id} : {}),
            recipientId: notification.recipientId,
            notificationTemplateId: notification.notificationTemplateId,
            reservationId: notification.reservationId,
            parkingStayId: notification.parkingStayId,
            alertId: notification.alertId,
            title: notification.title,
            message: notification.message,
            channel: notification.channel,
            status: notification.status,
            createdAt: notification.createdAt,
            sentAt: notification.sentAt,
            readAt: notification.readAt
        };
    }
}
