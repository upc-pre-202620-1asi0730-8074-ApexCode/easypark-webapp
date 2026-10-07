export class Profile {
    constructor({id = null, userAccountId, firstName, lastName, phone, photoUrl = null, createdAt}) {
        if (new.target === Profile) throw new TypeError('Profile is abstract; use DriverProfile or OperatorProfile.');
        this.id = id;
        this.userAccountId = userAccountId;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phone = phone;
        this.photoUrl = photoUrl;
        this.createdAt = createdAt;
    }

    get fullName() {
        return `${this.firstName} ${this.lastName}`.trim();
    }

    get shortName() {
        const lastNameInitial = this.lastName ? ` ${this.lastName.charAt(0).toUpperCase()}.` : '';
        return `${this.firstName}${lastNameInitial}`;
    }

    updateName(firstName, lastName) {
        this.firstName = firstName;
        this.lastName = lastName;
    }

    updatePhone(phone) {
        this.phone = phone;
    }
}
