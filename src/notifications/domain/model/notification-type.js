export const NotificationType = Object.freeze({
    RESERVATION_CONFIRMED: 'RESERVATION_CONFIRMED',
    RESERVATION_REMINDER: 'RESERVATION_REMINDER',
    TIME_REMAINING: 'TIME_REMAINING',
    STAY_EXPIRED: 'STAY_EXPIRED',
    CHECK_IN_CONFIRMED: 'CHECK_IN_CONFIRMED',
    CHECK_OUT_CONFIRMED: 'CHECK_OUT_CONFIRMED',
    ALERT_RAISED: 'ALERT_RAISED'
});

/**
 * Icon tile tone of every notification type, mapped onto the existing
 * `.status-badge--*` palette: amber for the time-limit notices
 * (TIME_REMAINING, STAY_EXPIRED) and for alerts, green for the movement
 * confirmations (the vehicle moved as expected) and blue for the reservation
 * confirmations and reminders. The report documents these three tone groups
 * only, so no new group was invented.
 */
export const NOTIFICATION_TONE_BY_TYPE = Object.freeze({
    [NotificationType.RESERVATION_CONFIRMED]: 'info',
    [NotificationType.RESERVATION_REMINDER]: 'info',
    [NotificationType.TIME_REMAINING]: 'warning',
    [NotificationType.STAY_EXPIRED]: 'warning',
    [NotificationType.CHECK_IN_CONFIRMED]: 'success',
    [NotificationType.CHECK_OUT_CONFIRMED]: 'success',
    [NotificationType.ALERT_RAISED]: 'warning'
});
