
import {AlertRule} from '../domain/model/alert-rule.entity.js';

export class AlertRuleAssembler {
    static toEntityFromResource(resource) {
        return new AlertRule({
            id: resource.id,
            parkingFacilityId: resource.parkingFacilityId,
            type: resource.alertType,
            severity: resource.severity,
            threshold: resource.threshold,
            enabled: resource.enabled,
            updatedAt: resource.updatedAt ?? null
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200 || !Array.isArray(response.data)) {
            throw new Error('Invalid alert rules response');
        }

        return response.data.map(resource =>
            this.toEntityFromResource(resource)
        );
    }

    static toResourceFromEntity(rule) {
        return {
            ...(rule.id != null ? {id: rule.id} : {}),
            parkingFacilityId: rule.parkingFacilityId,
            alertType: rule.type,
            severity: rule.severity,
            threshold: rule.threshold,
            enabled: rule.enabled,
            updatedAt: rule.updatedAt
        };
    }
}
