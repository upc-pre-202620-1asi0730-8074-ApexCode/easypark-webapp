export class CreateReservationCommand {
    constructor({
      driverProfileId,
      vehicleId,
      parkingFacilityId,
      startAt,
      durationMinutes
     }) {
        this.driverProfileId = driverProfileId;
        this.vehicleId = vehicleId;
        this.parkingFacilityId = parkingFacilityId;
        this.startAt = startAt ;
        this.durationMinutes = Number(durationMinutes);
    }
}