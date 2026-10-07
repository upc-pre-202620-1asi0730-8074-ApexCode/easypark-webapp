import {Notification} from "./notification.entity.js";
import {NotificationChannel} from "./notification-channel.js";
import {NotificationStatus} from "./notification-status.js";

/**
 * Text of a notification type in one locale. The notification row stores its
 * own copy of the already-rendered `title`/`message`, so the template only
 * documents which text was sent and lets the UI recover the type.
 */
export class NotificationTemplate {
    constructor({
                    id = null,
                    type,
                    locale,
                    titleTemplate,
                    bodyTemplate
                }) {
        this.id = id;
        this.type = type;
        this.locale = locale;
        this.titleTemplate = titleTemplate;
        this.bodyTemplate = bodyTemplate;
    }

    /**
     * `Render(NotificationPayload): Notification` of the class diagram: builds
     * a brand new PENDING notification whose text is this template with the
     * payload tokens replaced.
     *
     * Token syntax is `{fieldName}`; a null, undefined or empty payload value
     * substitutes the empty string so a missing optional value never leaks
     * "null" into the message.
     *
     * @param {import("./notification-payload.js").NotificationPayload} payload
     * @param {{channel?: string, now?: Date}} options
     * @returns {Notification} a new PENDING notification, not this template's
     *   stored copy.
     */
    render(
        payload,
        {channel = NotificationChannel.IN_APP, now = new Date()} = {}
    ) {
        return new Notification({
            recipientId: payload.recipientId,
            notificationTemplateId: this.id,
            reservationId: payload.reservationId ?? null,
            parkingStayId: payload.parkingStayId ?? null,
            alertId: payload.alertId ?? null,
            title: this.#substitute(this.titleTemplate, payload),
            message: this.#substitute(this.bodyTemplate, payload),
            channel,
            status: NotificationStatus.PENDING,
            createdAt: this.#toIso(now),
            sentAt: null,
            readAt: null
        });
    }

    #substitute(template, payload) {
        return (template ?? '').replace(
            /\{(\w+)\}/g,
            (token, field) => this.#valueOf(payload, field)
        );
    }

    #valueOf(payload, field) {
        const value = payload?.[field];

        if (value === null || value === undefined || value === '') {
            return '';
        }

        return String(value);
    }

    #toIso(value) {
        return value instanceof Date
            ? value.toISOString()
            : value;
    }
}
