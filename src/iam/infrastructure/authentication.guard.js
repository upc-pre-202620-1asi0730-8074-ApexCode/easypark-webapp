import useIamStore from "../application/iam.store.js";

/**
 * Protege las rutas: el visitante anónimo solo accede a las públicas, quien ya inició sesión no vuelve a los formularios y se respetan los roles de meta.roles.
 */
export const authenticationGuard = (to) => {
    const store = useIamStore();
    const isPublic = to.matched.some(record => record.meta['public']);
    const isAuthenticationForm = to.matched.some(record => record.meta['authenticationForm']);
    if (!store.isSignedIn) {
        if (isPublic || isAuthenticationForm) return true;
        return { name: 'iam-sign-in', query: { redirect: to.fullPath } };
    }
    if (isAuthenticationForm) return { name: 'home' };
    const allowedRoles = to.meta['roles'];
    if (allowedRoles && !allowedRoles.includes(store.currentRole)) return { name: 'home' };
    return true;
}
