export class Variety {
    public name: string;
    public fullName: string;
    public product: string;
    public price: number;
    public shop: string;

    constructor(
        name: string,
        fullName: string,
        product: string,
        price: number,
        shop: string,
    ) {
        this.name = name;
        this.fullName = fullName;
        this.product = product;
        this.price = price;
        this.shop = shop;
    }
}
