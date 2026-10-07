export class OccupancyMetric {
    constructor({
                    id = null,
                    parkingFacilityId,
                    measuredAt = new Date().toISOString(),
                    occupancyRate = 0,
                    entryCount = 0,
                    exitCount = 0,
                    averageStayMinutes = 0,
                    revenue = 0,
                    currency = 'PEN'
                }) {
        this.id = id;
        this.parkingFacilityId =
            parkingFacilityId;

        this.measuredAt =
            measuredAt;

        this.occupancyRate =
            Number(occupancyRate);

        this.entryCount =
            Number(entryCount);

        this.exitCount =
            Number(exitCount);

        this.averageStayMinutes =
            Number(averageStayMinutes);

        this.revenue =
            Number(revenue);

        this.currency =
            currency;
    }
}