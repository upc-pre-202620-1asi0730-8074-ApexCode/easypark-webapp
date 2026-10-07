import {SessionRepository} from "./session.repository.js";

/**
 * Agrega el token Bearer a cada solicitud cuando hay una sesión activa.
 */
export const iamInterceptor = (config) => {
    const session = SessionRepository.load();
    if (session?.token) config.headers.Authorization = `Bearer ${session.token}`;
    return config;
}
