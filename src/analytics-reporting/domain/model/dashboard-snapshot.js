export class DashboardSnapshot {
    constructor({
                    operatorId = null,
                    totalOccupancy = 0,
                    revenueToday = 0,
                    activeAlerts = 0,
                    availableSpaces = 0,
                    zones = []
                } = {}) {
        this.operatorId = operatorId;
        this.totalOccupancy =
            Number(totalOccupancy);

        this.revenueToday =
            Number(revenueToday);

        this.activeAlerts =
            Number(activeAlerts);

        this.availableSpaces =
            Number(availableSpaces);

        this.zones = zones;
    }

    refresh({
                totalOccupancy,
                revenueToday,
                activeAlerts = 0,
                availableSpaces,
                zones = []
            }) {
        this.totalOccupancy =
            Number(totalOccupancy);

        this.revenueToday =
            Number(revenueToday);

        this.activeAlerts =
            Number(activeAlerts);

        this.availableSpaces =
            Number(availableSpaces);

        this.zones = zones;
    }
}