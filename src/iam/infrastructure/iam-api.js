import {BaseEndpoint} from "../../shared/infrastructure/base-endpoint.js";
import {BaseApi} from "../../shared/infrastructure/base-api.js";

const signInEndpointPath = import.meta.env.VITE_SIGNIN_ENDPOINT_PATH;
const signUpEndpointPath = import.meta.env.VITE_SIGNUP_ENDPOINT_PATH;
const passwordEndpointPath = import.meta.env.VITE_PASSWORD_ENDPOINT_PATH;

export class IamApi extends BaseApi {
    #signInEndpoint;
    #signUpEndpoint;

    constructor() {
        super();
        this.#signInEndpoint = new BaseEndpoint(this, signInEndpointPath);
        this.#signUpEndpoint = new BaseEndpoint(this, signUpEndpointPath);
    }

    signIn(signInCommand) {
        return this.#signInEndpoint.create(signInCommand);
    }

    signUp(signUpCommand) {
        return this.#signUpEndpoint.create(signUpCommand);
    }

    changePassword(changePasswordCommand) {
        return this.http.put(passwordEndpointPath, changePasswordCommand);
    }
}
