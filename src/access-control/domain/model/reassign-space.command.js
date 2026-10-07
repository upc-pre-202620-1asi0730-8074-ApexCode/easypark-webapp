export class ReassignSpaceCommand {
    constructor({
                    parkingStayId,
                    parkingSpotId
                }) {
        this.parkingStayId = parkingStayId;
        this.parkingSpotId = parkingSpotId;
    }
}