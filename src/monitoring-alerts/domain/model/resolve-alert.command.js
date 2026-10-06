export class ResolveAlertCommand {
    constructor({
                    alertId,
                    operatorId = null,
                    note = null
                }) {
        this.alertId = alertId;
        this.operatorId = operatorId;
        this.note = note || null;
    }
}
