const reports =
    () => import('./views/reports.vue');

const operatorRoles = [
    'OPERATOR_ADMIN',
    'OPERATOR_STAFF'
];

const analyticsReportingRoutes = [
    {
        path: 'reports',
        name: 'analytics-reporting-reports',
        component: reports,
        meta: {
            title: 'Reports',
            roles: operatorRoles
        }
    }
];

export default analyticsReportingRoutes;