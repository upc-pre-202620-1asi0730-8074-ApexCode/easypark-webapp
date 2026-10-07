const facilities = () => import('./views/facilities.vue');
const facilityDetail = () => import('./views/facility-detail.vue');

const operatorRoles = ['OPERATOR_ADMIN', 'OPERATOR_STAFF'];

const parkingManagementRoutes = [
    {path: 'facilities', name: 'parking-management-facilities', component: facilities, meta: {title: 'Parking Facilities', roles: operatorRoles}},
    {path: 'facilities/:facilityId', name: 'parking-management-facility-detail', component: facilityDetail, meta: {title: 'Facility Detail', roles: operatorRoles}}
];

export default parkingManagementRoutes;
