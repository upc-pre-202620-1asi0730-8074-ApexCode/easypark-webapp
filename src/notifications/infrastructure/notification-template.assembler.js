import {NotificationTemplate} from "../domain/model/notification-template.entity.js";

export class NotificationTemplateAssembler {
    static toEntityFromResource(resource) {
        return new NotificationTemplate({
            id: resource.id,
            type: resource.type,
            locale: resource.locale,
            titleTemplate: resource.titleTemplate,
            bodyTemplate: resource.bodyTemplate
        });
    }

    static toEntitiesFromResponse(response) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return [];
        }

        return response.data.map(resource =>
            this.toEntityFromResource(resource)
        );
    }

    static toResourceFromEntity(template) {
        return {
            ...(template.id !== null ? {id: template.id} : {}),
            type: template.type,
            locale: template.locale,
            titleTemplate: template.titleTemplate,
            bodyTemplate: template.bodyTemplate
        };
    }
}
