export class SignInCommand {
    constructor({email, password}) {
        this.email = email.trim().toLowerCase();
        this.password = password;
    }
}
