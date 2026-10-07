import {DriverProfile} from "../domain/model/driver-profile.entity.js";
import {OperatorProfile} from "../domain/model/operator-profile.entity.js";

export class ProfileAssembler {

    static toEntityFromResource(resource, isOperator) {
        const attributes = {
            id: resource.id,
            userAccountId: resource.userAccountId,
            firstName: resource.firstName,
            lastName: resource.lastName,
            phone: resource.phone,
            photoUrl: resource.photoUrl ?? null,
            createdAt: resource.createdAt
        };
        return isOperator
            ? new OperatorProfile({ ...attributes, companyName: resource.companyName ?? '', jobTitle: resource.jobTitle ?? '' })
            : new DriverProfile(attributes);
    }

    static toEntityFromCollectionResponse(response, isOperator) {
        if (response.status !== 200) {
            console.error(`${response.status}, ${response.statusText}`);
            return null;
        }
        const [resource] = response.data;
        return resource ? this.toEntityFromResource(resource, isOperator) : null;
    }

    static toResourceFromEntity(profile) {
        const resource = {
            ...(profile.id !== null ? { id: profile.id } : {}),
            userAccountId: profile.userAccountId,
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
            photoUrl: profile.photoUrl,
            createdAt: profile.createdAt
        };
        if (profile instanceof OperatorProfile) {
            resource.companyName = profile.companyName;
            resource.jobTitle = profile.jobTitle;
        }
        return resource;
    }
}
