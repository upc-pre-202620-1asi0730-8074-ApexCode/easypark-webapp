
const alerts = () => import('./views/alerts.vue');

const monitoringAlertsRoutes = [
    {
        path: 'alerts',
        name: 'monitoring-alerts-alerts',
        component: alerts,
        meta: {
            title: 'Monitoring and Alerts',
            roles: ['OPERATOR_ADMIN']
        }
    }
];

export default monitoringAlertsRoutes;
