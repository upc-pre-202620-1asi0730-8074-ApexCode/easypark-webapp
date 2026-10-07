export class CreateSpotCommand {
    constructor({code, level = 1, type}) {
        this.code = code.trim().toUpperCase();
        this.level = level;
        this.type = type;
    }
}
