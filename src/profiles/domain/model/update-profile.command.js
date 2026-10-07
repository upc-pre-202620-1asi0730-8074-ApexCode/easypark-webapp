export class UpdateProfileCommand {
    constructor({firstName, lastName, phone, companyName = '', jobTitle = ''}) {
        this.firstName = firstName.trim();
        this.lastName = lastName.trim();
        this.phone = phone.trim();
        this.companyName = companyName.trim();
        this.jobTitle = jobTitle.trim();
    }
}
