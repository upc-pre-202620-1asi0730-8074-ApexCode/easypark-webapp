export class UpdateSpotCommand {
    constructor({spotId, code, level = 1, type}) {
        this.spotId = spotId;
        this.code = code.trim().toUpperCase();
        this.level = level;
        this.type = type;
    }
}
