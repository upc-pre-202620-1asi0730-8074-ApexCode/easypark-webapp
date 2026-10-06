import {AlertSeverity} from "./alert-severity.js";

export const AlertType = Object.freeze({
    CAPACITY_CRITICAL: 'CAPACITY_CRITICAL',
    CAPACITY_NEAR_LIMIT: 'CAPACITY_NEAR_LIMIT',
    STAY_EXCEEDED: 'STAY_EXCEEDED',
    UNRECOGNIZED_PLATE: 'UNRECOGNIZED_PLATE',
    ACCESS_WITHOUT_RESERVATION: 'ACCESS_WITHOUT_RESERVATION'
});

/**
 * Default severity of every alert type. Alert types that are not configured as
 * rules (those reacting to Access Control events) still need a severity.
 */
export const ALERT_SEVERITY_BY_TYPE = Object.freeze({
    [AlertType.CAPACITY_CRITICAL]: AlertSeverity.HIGH,
    [AlertType.CAPACITY_NEAR_LIMIT]: AlertSeverity.MEDIUM,
    [AlertType.STAY_EXCEEDED]: AlertSeverity.HIGH,
    [AlertType.UNRECOGNIZED_PLATE]: AlertSeverity.LOW,
    [AlertType.ACCESS_WITHOUT_RESERVATION]: AlertSeverity.MEDIUM
});
