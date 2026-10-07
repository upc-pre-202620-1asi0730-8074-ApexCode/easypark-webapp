const myProfile = () => import('./views/my-profile.vue');

const profilesRoutes = [
    { path: 'me', name: 'profiles-my-profile', component: myProfile, meta: { title: 'My Profile' } }
];

export default profilesRoutes;
