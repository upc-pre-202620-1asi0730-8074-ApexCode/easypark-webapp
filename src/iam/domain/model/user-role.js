export const UserRole = Object.freeze({
    DRIVER: 'DRIVER',
    OPERATOR_ADMIN: 'OPERATOR_ADMIN',
    OPERATOR_STAFF: 'OPERATOR_STAFF'
});

export const selfRegistrationRoles = Object.freeze([UserRole.DRIVER, UserRole.OPERATOR_ADMIN]);

export function isOperatorRole(role) {
    return role === UserRole.OPERATOR_ADMIN || role === UserRole.OPERATOR_STAFF;
}
