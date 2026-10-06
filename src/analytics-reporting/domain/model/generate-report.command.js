export class GenerateReportCommand {
    constructor({
                    operatorId,
                    parkingFacilityId,
                    type,
                    period
                }) {
        this.operatorId = operatorId;
        this.parkingFacilityId =
            parkingFacilityId;

        this.type = type;
        this.period = period;
    }
}