export class CreateFacilityCommand {
    constructor({operatorProfileId, name, address, latitude = null, longitude = null, hourlyRate, openTime = '00:00', closeTime = '23:59'}) {
        this.operatorProfileId = operatorProfileId;
        this.name = name.trim();
        this.address = address.trim();
        this.latitude = latitude;
        this.longitude = longitude;
        this.hourlyRate = hourlyRate;
        this.openTime = openTime;
        this.closeTime = closeTime;
    }
}
