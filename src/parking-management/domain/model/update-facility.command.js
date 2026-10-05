export class UpdateFacilityCommand {
    constructor({name, address, hourlyRate, openTime = '00:00', closeTime = '23:59'}) {
        this.name = name.trim();
        this.address = address.trim();
        this.hourlyRate = hourlyRate;
        this.openTime = openTime;
        this.closeTime = closeTime;
    }
}
