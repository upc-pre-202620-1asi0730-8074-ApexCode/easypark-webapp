import {OccupancyMetric} from "../domain/model/occupancy-metric.entity.js";

export class OccupancyMetricAssembler {
    static toEntityFromResource(resource) {
        return new OccupancyMetric({
            id: resource.id,
            parkingFacilityId:
            resource.parkingFacilityId,
            measuredAt:
            resource.measuredAt,
            occupancyRate:
            resource.occupancyRate,
            entryCount:
            resource.entryCount,
            exitCount:
            resource.exitCount,
            averageStayMinutes:
            resource.averageStayMinutes,
            revenue:
            resource.revenue,
            currency:
                resource.currency ?? 'PEN'
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(
                `${response.status}, ${response.statusText}`
            );

            return [];
        }

        return response.data.map(
            resource =>
                this.toEntityFromResource(
                    resource
                )
        );
    }

    static toResourceFromEntity(metric) {
        return {
            ...(metric.id !== null
                ? {id: metric.id}
                : {}),
            parkingFacilityId:
            metric.parkingFacilityId,
            measuredAt:
            metric.measuredAt,
            occupancyRate:
            metric.occupancyRate,
            entryCount:
            metric.entryCount,
            exitCount:
            metric.exitCount,
            averageStayMinutes:
            metric.averageStayMinutes,
            revenue:
            metric.revenue,
            currency:
            metric.currency
        };
    }
}