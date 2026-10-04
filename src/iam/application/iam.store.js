import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {IamApi} from "../infrastructure/iam-api.js";
import {SignInAssembler} from "../infrastructure/sign-in.assembler.js";
import {SignUpAssembler} from "../infrastructure/sign-up.assembler.js";
import {UserAccountAssembler} from "../infrastructure/user-account.assembler.js";
import {SessionRepository} from "../infrastructure/session.repository.js";

const iamApi = new IamApi();

function outcome(success, reason) {
    return reason ? {success, reason} : {success};
}

/**
 * Indica si el destino de redirección es una ruta interna, para evitar redirecciones abiertas.
 */
function isInternalPath(redirect) {
    return typeof redirect === 'string' && redirect.startsWith('/') && !redirect.startsWith('//');
}

/**
 * Store de aplicación del contexto IAM: coordina los casos de uso de autenticación y expone el estado de la sesión.
 */
const useIamStore = defineStore('iam', () => {
    const storedSession = SessionRepository.load();
    const currentUser = ref(storedSession ? UserAccountAssembler.toEntityFromResource(storedSession) : null);
    const errors = ref([]);
    const isSignedIn = computed(() => currentUser.value !== null);
    const currentUserId = computed(() => currentUser.value?.id ?? null);
    const currentEmail = computed(() => currentUser.value?.email ?? null);
    const currentRole = computed(() => currentUser.value?.role ?? null);
    const isOperator = computed(() => currentUser.value?.isOperator ?? false);

    /**
     * Ejecuta el inicio de sesión, guarda la sesión y redirige al destino solicitado o al inicio.
     */
    function signIn(signInCommand, remember, router, redirect) {
        return iamApi.signIn(signInCommand)
            .then(response => {
                const signInResource = SignInAssembler.toResourceFromResponse(response);
                if (!signInResource) return outcome(false, 'failed');
                SessionRepository.save({...signInResource}, remember);
                currentUser.value = UserAccountAssembler.toEntityFromResource(signInResource);
                errors.value = [];
                router.push(isInternalPath(redirect) ? redirect : {name: 'home'});
                return outcome(true);
            })
            .catch(error => {
                errors.value.push(error);
                const status = error.response?.status;
                if (status === 401) return outcome(false, 'invalid-credentials');
                if (status === 403) return outcome(false, 'inactive-account');
                return outcome(false, 'failed');
            });
    }

    function signUp(signUpCommand, router) {
        return iamApi.signUp(signUpCommand)
            .then(response => {
                const signUpResource = SignUpAssembler.toResourceFromResponse(response);
                if (!signUpResource) return outcome(false, 'failed');
                errors.value = [];
                router.push({name: 'iam-sign-in', query: {email: signUpResource.email, registered: 'true'}});
                return outcome(true);
            })
            .catch(error => {
                errors.value.push(error);
                return outcome(false, error.response?.status === 409 ? 'email-taken' : 'failed');
            });
    }

    function changePassword(changePasswordCommand) {
        return iamApi.changePassword(changePasswordCommand)
            .then(() => {
                errors.value = [];
                return outcome(true);
            })
            .catch(error => {
                errors.value.push(error);
                const status = error.response?.status;
                if (status === 422) return outcome(false, 'wrong-current-password');
                if (status === 401) return outcome(false, 'session-expired');
                return outcome(false, 'failed');
            });
    }

    /**
     * Cierra la sesión activa, elimina los datos almacenados y vuelve al formulario de inicio de sesión.
     */
    function signOut(router) {
        SessionRepository.clear();
        currentUser.value = null;
        errors.value = [];
        router.push({name: 'iam-sign-in'});
    }

    return {
        currentUser,
        errors,
        isSignedIn,
        currentUserId,
        currentEmail,
        currentRole,
        isOperator,
        signIn,
        signUp,
        changePassword,
        signOut
    };
});

export default useIamStore;
