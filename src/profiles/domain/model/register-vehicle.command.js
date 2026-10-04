export class RegisterVehicleCommand {
    constructor({plateNumber, type, color = ''}) {
        this.plateNumber = plateNumber;
        this.type = type;
        this.color = color.trim();
    }
}
