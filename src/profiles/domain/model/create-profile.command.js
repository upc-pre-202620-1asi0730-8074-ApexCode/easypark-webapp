export class CreateProfileCommand {
    constructor({userAccountId, firstName, lastName, phone, companyName = '', jobTitle = ''}) {
        this.userAccountId = userAccountId;
        this.firstName = firstName.trim();
        this.lastName = lastName.trim();
        this.phone = phone.trim();
        this.companyName = companyName.trim();
        this.jobTitle = jobTitle.trim();
    }
}
