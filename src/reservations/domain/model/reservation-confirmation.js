export class ReservationConfirmation{
    constructor({
       reservationCode,
       issuedAt = new Date().toISOString()
    }) {
        this.reservationCode = reservationCode;
        this.issuedAt = issuedAt;

    }
    get  isValid(){
        return  Boolean(this.reservationCode)
    }












}