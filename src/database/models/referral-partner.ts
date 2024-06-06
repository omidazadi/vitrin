export class ReferralPartner {
    public name: string;
    public visitor: number;
    public fee: number;
    public paymentData: string | null;
    public shop: string;

    constructor(
        name: string,
        visitor: number,
        fee: number,
        paymentData: string | null,
        shop: string,
    ) {
        this.name = name;
        this.visitor = visitor;
        this.fee = fee;
        this.paymentData = paymentData;
        this.shop = shop;
    }
}
