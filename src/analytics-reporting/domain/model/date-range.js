export class DateRange {
    constructor({
                    start,
                    end
                }) {
        const startDate = new Date(start);
        const endDate = new Date(end);

        this.start =
            Number.isNaN(startDate.getTime())
                ? null
                : startDate.toISOString();

        this.end =
            Number.isNaN(endDate.getTime())
                ? null
                : endDate.toISOString();
    }

    get isValid() {
        if (!this.start || !this.end) {
            return false;
        }

        return (
            new Date(this.start) <=
            new Date(this.end)
        );
    }

    contains(moment) {
        if (!this.isValid || !moment) {
            return false;
        }

        const value = new Date(moment);

        return (
            value >= new Date(this.start) &&
            value <= new Date(this.end)
        );
    }

    days() {
        if (!this.isValid) {
            return 0;
        }

        const milliseconds =
            new Date(this.end) -
            new Date(this.start);

        return (
            Math.floor(
                milliseconds / 86400000
            ) + 1
        );
    }
}