export class ChangePasswordCommand {
    constructor({currentPassword, newPassword}) {
        this.currentPassword = currentPassword;
        this.newPassword = newPassword;
    }
}
