export class Vehicle {
    constructor({id = null, profileId = null, plateNumber, type = null, color = null, isDefault = false, createdAt}) {
        this.id = id;
        this.profileId = profileId;
        this.plateNumber = plateNumber;
        this.type = type;
        this.color = color;
        this.isDefault = isDefault;
        this.createdAt = createdAt;
    }

    get hasOwner() {
        return this.profileId !== null && this.profileId !== undefined;
    }

    assignOwner(profileId) {
        this.profileId = profileId;
    }


    releaseOwner() {
        this.profileId = null;
        this.isDefault = false;
    }

    updateData(type, color) {
        this.type = type;
        this.color = color;
    }
}
