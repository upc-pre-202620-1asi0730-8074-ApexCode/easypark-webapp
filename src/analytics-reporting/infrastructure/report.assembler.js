import {Report} from "../domain/model/report.entity.js";
import {DateRange} from "../domain/model/date-range.js";

export class ReportAssembler {
    static toEntityFromResource(resource) {
        return new Report({
            id: resource.id,
            operatorId:
            resource.operatorId,
            parkingFacilityId:
            resource.parkingFacilityId,
            type:
            resource.reportType,
            period:
                new DateRange({
                    start:
                    resource.periodStart,
                    end:
                    resource.periodEnd
                }),
            generatedAt:
            resource.generatedAt,
            metrics: []
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

    static toResourceFromEntity(report) {
        return {
            ...(report.id !== null
                ? {id: report.id}
                : {}),
            operatorId:
            report.operatorId,
            parkingFacilityId:
            report.parkingFacilityId,
            reportType:
            report.type,
            periodStart:
            report.period.start,
            periodEnd:
            report.period.end,
            generatedAt:
            report.generatedAt
        };
    }
}