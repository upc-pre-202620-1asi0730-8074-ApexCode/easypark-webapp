export class UpdateVehicleCommand {
    constructor({vehicleId, type, color = ''}) {
        this.vehicleId = vehicleId;
        this.type = type;
        this.color = color.trim();
    }
}
