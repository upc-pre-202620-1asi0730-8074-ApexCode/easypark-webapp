const createReservation =
    () => import('./views/create-reservation.vue');

const myReservations =
    () => import('./views/my-reservations.vue');

const driverRoles = ['DRIVER'];

const reservationsRoutes = [
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