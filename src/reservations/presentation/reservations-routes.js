const createReservation =
    () => import('./views/create-reservation.vue');

const myReservations =
    () => import('./views/my-reservations.vue');

const parkingDetail =
    () => import('./views/parking-detail.vue');

const driverRoles = ['DRIVER'];

const reservationsRoutes = [
    {
        path: 'facility/:facilityId',
        name: 'reservations-parking-detail',
        component: parkingDetail,
        meta: {
            title: 'Parking Details',
            roles: driverRoles
        }
    },
    {
        path: 'new',
        name: 'reservations-create',
        component: createReservation,
        meta: {
            title: 'Reserve a Space',
            roles: driverRoles
        }
    },
    {
        path: 'mine',
        name: 'reservations-my',
        component: myReservations,
        meta: {
            title: 'My Reservations',
            roles: driverRoles
        }
    }
];

export default reservationsRoutes;