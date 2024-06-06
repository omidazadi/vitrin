export class CartItem {
    public customer: number;
    public product: string;
    public variety: string;
    public createdAt: Date;
    public shop: string;

    constructor(
        customer: number,
        product: string,
        variety: string,
        createdAt: Date,
        shop: string,
    ) {
        this.customer = customer;
        this.product = product;
        this.variety = variety;
        this.createdAt = createdAt;
        this.shop = shop;
    }
}
