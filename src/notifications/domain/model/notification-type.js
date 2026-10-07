export const NotificationType = Object.freeze({
    RESERVATION_CONFIRMED: 'RESERVATION_CONFIRMED',
    RESERVATION_REMINDER: 'RESERVATION_REMINDER',
    TIME_REMAINING: 'TIME_REMAINING',
    STAY_EXPIRED: 'STAY_EXPIRED',
    CHECK_IN_CONFIRMED: 'CHECK_IN_CONFIRMED',
    CHECK_OUT_CONFIRMED: 'CHECK_OUT_CONFIRMED',
    ALERT_RAISED: 'ALERT_RAISED'
});

export const NOTIFICATION_TONE_BY_TYPE = Object.freeze({
    [NotificationType.RESERVATION_CONFIRMED]: 'info',
    [NotificationType.RESERVATION_REMINDER]: 'info',
    [NotificationType.TIME_REMAINING]: 'warning',
    [NotificationType.STAY_EXPIRED]: 'warning',
    [NotificationType.CHECK_IN_CONFIRMED]: 'success',
    [NotificationType.CHECK_OUT_CONFIRMED]: 'success',
    [NotificationType.ALERT_RAISED]: 'warning'
});
