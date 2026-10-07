const sessionKey = 'easypark.session';

/**
 * Guarda la sesión en localStorage si la persona eligió «Recordarme»; en caso contrario, en sessionStorage hasta cerrar la pestaña.
 */
export class SessionRepository {
    static save(session, remember) {
        this.clear();
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(sessionKey, JSON.stringify(session));
    }

    static load() {
        const stored = localStorage.getItem(sessionKey) ?? sessionStorage.getItem(sessionKey);
        if (!stored) return null;
        try {
            return JSON.parse(stored);
        } catch {
            this.clear();
            return null;
        }
    }

    static clear() {
        localStorage.removeItem(sessionKey);
        sessionStorage.removeItem(sessionKey);
    }
}
