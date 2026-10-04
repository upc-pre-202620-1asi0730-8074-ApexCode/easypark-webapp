import {SignUpResource} from "./sign-up.resource.js";

export class SignUpAssembler {
    static toResourceFromResponse(response) {
        if (response.status !== 201) {
            console.error(`${response.status}, ${response.statusText}`);
            return null;
        }
        return new SignUpResource(response.data);
    }
}
