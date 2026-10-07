const crypto = require('crypto');

const USER_ACCOUNTS = 'user-accounts';
const SELF_REGISTRATION_ROLES = ['DRIVER', 'OPERATOR_ADMIN'];
const TOKEN_LIFETIME_MS = 8 * 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

/**
 * Aplica SHA-256 a la contraseña para no guardarla en texto plano en la API simulada.
 */
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Emite un token opaco con el identificador, el rol y la expiración de la cuenta.
 */
function issueToken(userAccount) {
    const payload = { sub: userAccount.id, role: userAccount.role, exp: Date.now() + TOKEN_LIFETIME_MS };
    return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

/**
 * Lee y valida el token Bearer; devuelve null si falta, está mal formado o expiró.
 */
function readToken(request) {
    const header = request.headers.authorization || '';
    if (!header.startsWith('Bearer ')) return null;
    try {
        const payload = JSON.parse(Buffer.from(header.slice(7), 'base64url').toString());
        return payload.exp > Date.now() ? payload : null;
    } catch {
        return null;
    }
}

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

function signUp(request, response) {
    const userAccounts = request.app.db.get(USER_ACCOUNTS);
    const email = normalizeEmail(request.body.email);
    const { password, role } = request.body;
    if (!EMAIL_PATTERN.test(email) || !password || password.length < MIN_PASSWORD_LENGTH || !SELF_REGISTRATION_ROLES.includes(role))
        return response.status(400).json({ message: 'Invalid sign-up data.' });
    if (userAccounts.find({ email }).value())
        return response.status(409).json({ message: 'The e-mail address is already registered.' });
    const userAccount = userAccounts.insert({
        email,
        passwordHash: hashPassword(password),
        role,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        lastLoginAt: null
    }).value();
    request.app.db.write();
    return response.status(201).json({ id: userAccount.id, email: userAccount.email, role: userAccount.role });
}

function signIn(request, response) {
    const userAccounts = request.app.db.get(USER_ACCOUNTS);
    const email = normalizeEmail(request.body.email);
    const userAccount = userAccounts.find({ email }).value();
    if (!userAccount || userAccount.passwordHash !== hashPassword(String(request.body.password || '')))
        return response.status(401).json({ message: 'Invalid credentials.' });
    if (userAccount.status !== 'ACTIVE')
        return response.status(403).json({ message: 'The account is not active.' });
    userAccounts.find({ id: userAccount.id }).assign({ lastLoginAt: new Date().toISOString() }).write();
    return response.status(200).json({
        id: userAccount.id,
        email: userAccount.email,
        role: userAccount.role,
        token: issueToken(userAccount)
    });
}

function changePassword(request, response) {
    const token = readToken(request);
    if (!token) return response.status(401).json({ message: 'Authentication required.' });
    const userAccounts = request.app.db.get(USER_ACCOUNTS);
    const userAccount = userAccounts.find({ id: token.sub }).value();
    const { currentPassword, newPassword } = request.body;
    if (!userAccount || userAccount.passwordHash !== hashPassword(String(currentPassword || '')))
        return response.status(422).json({ message: 'The current password is incorrect.' });
    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH)
        return response.status(400).json({ message: 'The new password is too short.' });
    userAccounts.find({ id: userAccount.id }).assign({ passwordHash: hashPassword(newPassword) }).write();
    return response.status(200).json({ message: 'Password updated.' });
}

/**
 * Middleware de json-server que simula los endpoints de autenticación y oculta las colecciones que contienen hashes de contraseña.
 */
module.exports = (request, response, next) => {
    if (request.method === 'POST' && request.path === '/authentication/sign-up') return signUp(request, response);
    if (request.method === 'POST' && request.path === '/authentication/sign-in') return signIn(request, response);
    if (request.method === 'PUT' && request.path === '/authentication/password') return changePassword(request, response);
    if (request.path === '/db' || request.path === `/${USER_ACCOUNTS}` || request.path.startsWith(`/${USER_ACCOUNTS}/`))
        return response.status(404).json({});
    return next();
};
