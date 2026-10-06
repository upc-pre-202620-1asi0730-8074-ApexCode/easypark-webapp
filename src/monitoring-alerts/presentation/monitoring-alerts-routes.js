const alerts =
    () => import('./views/alerts.vue');

const adminRoles = [
    'OPERATOR_ADMIN'
];

const monitoringAlertsRoutes = [
    {
        path: 'alerts',
        name: 'monitoring-alerts-alerts',
        component: alerts,
        meta: {
            title: 'Monitoring and Alerts',
            roles: adminRoles
        }
    }
];

export default monitoringAlertsRoutes;
