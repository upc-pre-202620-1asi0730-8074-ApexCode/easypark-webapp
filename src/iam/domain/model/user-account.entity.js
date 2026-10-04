import {isOperatorRole} from "./user-role.js";

export class UserAccount {
    constructor({id, email, role}) {
        this.id = id;
        this.email = email;
        this.role = role;
    }

    get isOperator() {
        return isOperatorRole(this.role);
    }
}
