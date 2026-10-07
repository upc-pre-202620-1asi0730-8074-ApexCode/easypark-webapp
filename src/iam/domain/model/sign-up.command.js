export class SignUpCommand {
    constructor({email, password, role}) {
        this.email = email.trim().toLowerCase();
        this.password = password;
        this.role = role;
    }
}
