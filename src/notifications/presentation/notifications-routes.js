const inbox =
    () => import('./views/inbox.vue');

const driverRoles = [
    'DRIVER'
];

const notificationsRoutes = [
    {
        path: 'inbox',
        name: 'notifications-inbox',
        component: inbox,
        meta: {
            title: 'Notifications',
            roles: driverRoles
        }
    }
];

export default notificationsRoutes;
