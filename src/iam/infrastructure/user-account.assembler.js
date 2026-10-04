import {UserAccount} from "../domain/model/user-account.entity.js";

export class UserAccountAssembler {
    static toEntityFromResource(resource) {
        return new UserAccount({id: resource.id, email: resource.email, role: resource.role});
    }
}
