import {ReportType} from "./report-type.js";

export class Report {
    constructor({
                    id = null,
                    operatorId,
                    parkingFacilityId,
                    type = ReportType.OCCUPANCY,
                    period,
                    generatedAt = new Date().toISOString(),
                    metrics = []
                }) {
        this.id = id;
        this.operatorId = operatorId;
        this.parkingFacilityId =
            parkingFacilityId;

        this.type = type;
        this.period = period;
        this.generatedAt = generatedAt;
        this.metrics = metrics;
    }

    generate(metrics) {
        this.metrics = [...metrics];
        this.generatedAt =
            new Date().toISOString();
    }

    totalRevenue() {
        return Number(
            this.metrics
                .reduce(
                    (total, metric) =>
                        total +
                        Number(metric.revenue || 0),
                    0
                )
                .toFixed(2)
        );
    }

    averageOccupancy() {
        if (!this.metrics.length) {
            return 0;
        }

        const total =
            this.metrics.reduce(
                (sum, metric) =>
                    sum +
                    Number(
                        metric.occupancyRate || 0
                    ),
                0
            );

        return Number(
            (
                total /
                this.metrics.length
            ).toFixed(2)
        );
    }

    get isEmpty() {
        return this.metrics.length === 0;
    }

    exportToCsv() {
        const header = [
            'Measured At',
            'Occupancy Rate',
            'Entries',
            'Exits',
            'Average Stay Minutes',
            'Revenue',
            'Currency'
        ];

        const rows =
            this.metrics.map(
                metric => [
                    metric.measuredAt,
                    metric.occupancyRate,
                    metric.entryCount,
                    metric.exitCount,
                    metric.averageStayMinutes,
                    metric.revenue,
                    metric.currency
                ]
            );

        return [
            header,
            ...rows
        ]
            .map(row =>
                row
                    .map(value =>
                        `"${String(value).replaceAll('"', '""')}"`
                    )
                    .join(',')
            )
            .join('\n');
    }
}