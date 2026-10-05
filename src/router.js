import {createRouter, createWebHistory} from "vue-router";
import Home from "./shared/presentation/views/home.vue";
import iamRoutes from "./iam/presentation/iam-routes.js";
import profilesRoutes from "./profiles/presentation/profiles-routes.js";
import parkingManagementRoutes from "./parking-management/presentation/parking-management-routes.js";
import {authenticationGuard} from "./iam/infrastructure/authentication.guard.js";

const about = () => import('./shared/presentation/views/about.vue');
const pageNotFound = () => import('./shared/presentation/views/page-not-found.vue');

const routes = [
    { path: '/home',               name: 'home',               component: Home,         meta: { title: 'Home' } },
    { path: '/about',              name: 'about',              component: about,        meta: { title: 'About', public: true } },
    { path: '/iam',                name: 'iam',                children: iamRoutes },
    { path: '/profiles',           name: 'profiles',           children: profilesRoutes },
    { path: '/parking-management', name: 'parking-management', children: parkingManagementRoutes },
    { path: '/',                redirect: '/home' },
    { path: '/:pathMatch(.*)*', name: 'not-found',  component: pageNotFound, meta: { title: 'Page Not Found', public: true } }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: routes
});

router.beforeEach((to) => {
    document.title = `EasyPark - ${to.meta['title']}`;
    return authenticationGuard(to);
});

export default router;
