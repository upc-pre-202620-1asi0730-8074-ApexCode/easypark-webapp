let activeSession = null;

// La sesion solo existe en memoria. NO se usa localStorage, sessionStorage, indexedDB ni JSON.
// No persiste al refrescar la pagina; volver a autenticarse es intencional.
export class SessionRepository {
    static save(session, _remember = false) {
        activeSession = session ? {...session} : null;
    }
    static load() {
        return activeSession ? {...activeSession} : null;
    }
    static clear() {
        activeSession = null;
    }
}
