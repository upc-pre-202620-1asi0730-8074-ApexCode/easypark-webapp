
export class ResolveAlertCommand {
    constructor({
                    alertId,
                    resolvedBy = null,
                    note = null
                }) {
        this.alertId = alertId;
        this.resolvedBy = resolvedBy;
        this.note = note?.trim() || null;
    }
}
