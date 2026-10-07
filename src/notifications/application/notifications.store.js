import {defineStore} from "pinia";
import {computed, ref} from "vue";

import {NotificationsApi} from "../infrastructure/notifications-api.js";
import {NotificationAssembler} from "../infrastructure/notification.assembler.js";
import {NotificationTemplateAssembler} from "../infrastructure/notification-template.assembler.js";

import {NotificationChannel} from "../domain/model/notification-channel.js";
import {NotificationType} from "../domain/model/notification-type.js";
import {NotificationContext} from "../domain/model/notification-context.js";

import {ProfileAssembler} from "../../profiles/infrastructure/profile.assembler.js";
import {VehicleAssembler} from "../../profiles/infrastructure/vehicle.assembler.js";
import {ReservationAssembler} from "../../reservations/infrastructure/reservation.assembler.js";
import {AccessMovementAssembler} from "../../access-control/infrastructure/access-movement.assembler.js";
import {ParkingStayAssembler} from "../../access-control/infrastructure/parking-stay.assembler.js";
import {AlertAssembler} from "../../monitoring-alerts/infrastructure/alert.assembler.js";
import {AlertRuleAssembler} from "../../monitoring-alerts/infrastructure/alert-rule.assembler.js";
import {FacilityAssembler} from "../../parking-management/infrastructure/facility.assembler.js";
import {SpotAssembler} from "../../parking-management/infrastructure/spot.assembler.js";


const notificationsApi = new NotificationsApi();

function outcome(success, reason) {
    return reason ? {success, reason} : {success};
}

function sortByNewestFirst(a, b) {
    return new Date(b.createdAt) - new Date(a.createdAt);
}

function isSameLocalDay(value, now) {
    if (!value) return false;

    const date = new Date(value);

    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );
}


function sourceKeyOf({reservationId, parkingStayId, alertId}) {
    if (reservationId != null) return `reservation:${reservationId}`;
    if (parkingStayId != null) return `stay:${parkingStayId}`;
    if (alertId != null) return `alert:${alertId}`;

    return 'none';
}

function dedupeKeyOf(type, source) {
    return `${type}|${sourceKeyOf(source)}`;
}


function typeOf(notification, templates) {
    return templates.find(
        template => template.id === notification.notificationTemplateId
    )?.type ?? null;
}

const useNotificationsStore = defineStore('notifications', () => {
    const notifications = ref([]);
    const templates = ref([]);
    const notificationsLoaded = ref(false);
    const errors = ref([]);

    const unreadCount = computed(
        () => notifications.value.filter(item => item.isUnread).length
    );

    const todayNotifications = computed(() => {
        const now = new Date();

        return notifications.value.filter(
            notification => isSameLocalDay(notification.createdAt, now)
        );
    });

    const yesterdayNotifications = computed(() => {
        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        return notifications.value.filter(
            notification => isSameLocalDay(notification.createdAt, yesterday)
        );
    });

    async function loadTemplates() {
        const response =
            await notificationsApi.getNotificationTemplates();

        templates.value =
            NotificationTemplateAssembler
                .toEntitiesFromResponse(response);
    }


    async function fetchNotifications(recipientId, locale) {
        notificationsLoaded.value = false;

        try {
            const response =
                await notificationsApi
                    .getNotificationsByRecipientId(recipientId);

            notifications.value =
                NotificationAssembler
                    .toEntitiesFromResponse(response)
                    .sort(sortByNewestFirst);

            await loadTemplates();

            errors.value = [];
        } catch (error) {
            notifications.value = [];
            templates.value = [];
            errors.value.push(error);
        } finally {
            notificationsLoaded.value = true;
        }
    }


    async function reactToSourceEvents(recipientId, locale) {
        const created = [];

        try {
            if (!templates.value.length) {
                await loadTemplates();
            }

            const [
                profileResponse,
                movementsResponse,
                staysResponse,
                alertsResponse,
                rulesResponse,
                facilitiesResponse,
                spotsResponse
            ] = await Promise.all([
                notificationsApi.getProfileByUserAccountId(recipientId),
                notificationsApi.getAccessMovements(),
                notificationsApi.getParkingStays(),
                notificationsApi.getAlerts(),
                notificationsApi.getAlertRules(),
                notificationsApi.getParkingFacilities(),
                notificationsApi.getParkingSpots()
            ]);

            const profile =
                ProfileAssembler
                    .toEntityFromCollectionResponse(profileResponse, false);

            if (!profile) return;

            const [
                reservationsResponse,
                vehiclesResponse
            ] = await Promise.all([
                notificationsApi
                    .getReservationsByDriverProfileId(profile.id),
                notificationsApi
                    .getVehiclesByProfileId(profile.id)
            ]);

            const context =
                new NotificationContext({
                    recipientId,
                    reservations:
                        ReservationAssembler
                            .toEntitiesFromResponse(reservationsResponse),
                    vehicles:
                        VehicleAssembler
                            .toEntitiesFromResponse(vehiclesResponse),
                    movements:
                        AccessMovementAssembler
                            .toEntitiesFromResponse(movementsResponse),
                    stays:
                        ParkingStayAssembler
                            .toEntitiesFromResponse(staysResponse),
                    alerts:
                        AlertAssembler
                            .toEntitiesFromResponse(alertsResponse),
                    alertRules:
                        AlertRuleAssembler
                            .toEntitiesFromResponse(rulesResponse),
                    spots:
                        SpotAssembler
                            .toEntitiesFromResponse(spotsResponse),
                    facilities:
                        FacilityAssembler
                            .toEntitiesFromResponse(facilitiesResponse),
                    templates: templates.value,
                    now: new Date()
                });

            const candidates = buildCandidates(context);

            for (const candidate of candidates) {
                if (hasNotificationFor(candidate)) continue;

                const template =
                    context.templateFor(candidate.type, locale);

                // Without its template the notification would have no text to
                // deliver: skip instead of persisting an empty message.
                if (!template) continue;

                const now = new Date();

                const notification = template.render(
                    context.payloadFor(candidate),
                    {channel: NotificationChannel.IN_APP, now}
                );

                // In-app delivery is synchronous: the row is already in the
                // inbox when it is persisted, so it leaves PENDING right away.
                notification.markAsSent(now);

                const response =
                    await notificationsApi.createNotification(
                        NotificationAssembler
                            .toResourceFromEntity(notification)
                    );

                created.push(
                    NotificationAssembler
                        .toEntityFromResource(response.data)
                );
            }
        } catch (error) {
            errors.value.push(error);
        }

        if (!created.length) return;

        notifications.value = [
            ...created,
            ...notifications.value
        ].sort(sortByNewestFirst);
    }


    function buildCandidates(context) {
        const onlySource = (type, source) => ({
            type,
            reservationId: null,
            parkingStayId: null,
            alertId: null,
            ...source
        });

        return [
            ...context.reservationsNeedingConfirmation().map(
                reservation => onlySource(
                    NotificationType.RESERVATION_CONFIRMED,
                    {reservationId: reservation.id}
                )
            ),

            ...context.reservationsApproachingStart().map(
                reservation => onlySource(
                    NotificationType.RESERVATION_REMINDER,
                    {reservationId: reservation.id}
                )
            ),

            ...context.staysWithCompletedEntry().map(
                stay => onlySource(
                    NotificationType.CHECK_IN_CONFIRMED,
                    {parkingStayId: stay.id}
                )
            ),

            ...context.closedStays().map(
                stay => onlySource(
                    NotificationType.CHECK_OUT_CONFIRMED,
                    {parkingStayId: stay.id}
                )
            ),

            ...context.openStaysApproachingLimit().map(
                stay => onlySource(
                    NotificationType.TIME_REMAINING,
                    {parkingStayId: stay.id}
                )
            ),

            ...context.openStaysOverLimit().map(
                stay => onlySource(
                    NotificationType.STAY_EXPIRED,
                    {parkingStayId: stay.id}
                )
            ),

            ...context.driverAlerts().map(
                alert => onlySource(
                    NotificationType.ALERT_RAISED,
                    {alertId: alert.id}
                )
            )
        ];
    }

    function hasNotificationFor(candidate) {
        const key = dedupeKeyOf(candidate.type, candidate);

        return notifications.value.some(
            notification =>
                dedupeKeyOf(
                    typeOf(notification, templates.value),
                    notification
                ) === key
        );
    }

    async function markNotificationRead(command) {
        const notification = notifications.value.find(
            item => item.id === command.notificationId
        );

        if (!notification) {
            return outcome(false, 'failed');
        }

        const previous = {
            status: notification.status,
            readAt: notification.readAt
        };

        if (!notification.markAsRead()) {
            return outcome(false, 'already-read');
        }

        try {
            await notificationsApi.updateNotification(
                notification.id,
                NotificationAssembler.toResourceFromEntity(notification)
            );

            errors.value = [];

            return outcome(true);
        } catch (error) {
            Object.assign(notification, previous);

            errors.value.push(error);

            return outcome(false, 'failed');
        }
    }

    async function markAllAsRead() {
        const unread = notifications.value.filter(item => item.isUnread);

        if (!unread.length) return outcome(true);

        try {
            for (const notification of unread) {
                const previous = {
                    status: notification.status,
                    readAt: notification.readAt
                };

                notification.markAsRead();

                try {
                    await notificationsApi.updateNotification(
                        notification.id,
                        NotificationAssembler
                            .toResourceFromEntity(notification)
                    );
                } catch (error) {
                    Object.assign(notification, previous);
                    throw error;
                }
            }

            errors.value = [];

            return outcome(true);
        } catch (error) {
            errors.value.push(error);

            return outcome(false, 'failed');
        }
    }

    function clear() {
        notifications.value = [];
        templates.value = [];
        notificationsLoaded.value = false;
        errors.value = [];
    }

    return {
        notifications,
        templates,
        notificationsLoaded,
        errors,
        unreadCount,
        todayNotifications,
        yesterdayNotifications,
        fetchNotifications,
        reactToSourceEvents,
        markNotificationRead,
        markAllAsRead,
        clear
    };
});

export default useNotificationsStore;
