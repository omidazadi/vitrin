export class CartItem {
    public customer: number;
    public product: string;
    public variety: string;
    public count: number;
    public shop: string;

    constructor(
        customer: number,
        product: string,
        variety: string,
        count: number,
        shop: string,
    ) {
        this.customer = customer;
        this.product = product;
        this.variety = variety;
        this.count = count;
        this.shop = shop;
    }
}
