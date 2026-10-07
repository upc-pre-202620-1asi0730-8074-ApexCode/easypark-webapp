const accesses =
    () => import('./views/accesses.vue');

const operatorRoles = [
    'OPERATOR_ADMIN',
    'OPERATOR_STAFF'
];

const accessControlRoutes = [
    {
        path: 'accesses',
        name: 'access-control-accesses',
        component: accesses,
        meta: {
            title: 'Access Control',
            roles: operatorRoles
        }
    }
];

export default accessControlRoutes;