import {
    NOTIFICATION_TONE_BY_TYPE,
    NotificationType
} from "../domain/model/notification-type.js";

/**
 * Icon shown for each notification type. Shared by the inbox list and the
 * driver home so both places describe a notification the same way.
 */
export const NOTIFICATION_ICON_BY_TYPE = Object.freeze({
    [NotificationType.TIME_REMAINING]: 'pi pi-clock',
    [NotificationType.STAY_EXPIRED]: 'pi pi-exclamation-circle',
    [NotificationType.ALERT_RAISED]: 'pi pi-exclamation-triangle',
    [NotificationType.CHECK_IN_CONFIRMED]: 'pi pi-check-circle',
    [NotificationType.CHECK_OUT_CONFIRMED]: 'pi pi-car',
    [NotificationType.RESERVATION_CONFIRMED]: 'pi pi-calendar',
    [NotificationType.RESERVATION_REMINDER]: 'pi pi-bell'
});

export function notificationIcon(type) {
    return NOTIFICATION_ICON_BY_TYPE[type] ?? 'pi pi-bell';
}

export function notificationTone(type) {
    return NOTIFICATION_TONE_BY_TYPE[type] ?? 'info';
}

/**
 * Renders a time as "6:15 PM" in every locale: the parts are taken
 * locale-aware and only the day period is normalized.
 */
export function formatNotificationTime(value, locale) {
    if (!value) return '—';

    const parts = new Intl.DateTimeFormat(
        locale,
        {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }
    ).formatToParts(new Date(value));

    const partOf = type =>
        parts.find(part => part.type === type)?.value ?? '';

    const dayPeriod = partOf('dayPeriod')
        .replace(/[.\s]/g, '')
        .toUpperCase();

    return `${partOf('hour')}:${partOf('minute')} ${dayPeriod}`;
}
