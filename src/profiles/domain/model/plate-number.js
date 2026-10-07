const carPlatePattern = /^([A-Z0-9]{3})-?([0-9]{3})$/;
const motorcyclePlatePattern = /^([0-9]{4})-?([A-Z]{2})$/;

/**
 * Objeto de valor de la placa peruana. Siempre se conserva normalizada (ABC-123 para autos, 1234-AB para motos), porque es el dato con el que el personal identifica un vehículo.
 */
export class PlateNumber {
    constructor(value) {
        const normalized = PlateNumber.normalize(value);
        if (!normalized) throw new Error('invalid-plate-number');
        this.value = normalized;
        Object.freeze(this);
    }

    static normalize(value) {
        const compact = String(value ?? '').toUpperCase().replace(/\s+/g, '');
        if (carPlatePattern.test(compact)) return compact.replace(carPlatePattern, '$1-$2');
        if (motorcyclePlatePattern.test(compact)) return compact.replace(motorcyclePlatePattern, '$1-$2');
        return null;
    }

    static isValid(value) {
        return PlateNumber.normalize(value) !== null;
    }

    equals(other) {
        return other instanceof PlateNumber && other.value === this.value;
    }

    toString() {
        return this.value;
    }
}
