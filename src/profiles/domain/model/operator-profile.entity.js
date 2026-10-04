import {Profile} from "./profile.entity.js";

export class OperatorProfile extends Profile {
    constructor({companyName = '', jobTitle = '', ...params}) {
        super(params);
        this.companyName = companyName;
        this.jobTitle = jobTitle;
    }

    updateEmployment(companyName, jobTitle) {
        this.companyName = companyName;
        this.jobTitle = jobTitle;
    }
}
