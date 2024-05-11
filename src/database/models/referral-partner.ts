export class ReferralPartner {
    public name: string;
    public visitor: number;
    public fee: number;
    public shop: string;

    constructor(name: string, visitor: number, fee: number, shop: string) {
        this.name = name;
        this.visitor = visitor;
        this.fee = fee;
        this.shop = shop;
    }
}
