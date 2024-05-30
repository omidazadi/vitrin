export class Variety {
    public name: string;
    public product: string;
    public price: number;
    public stock: number;
    public shop: string;

    constructor(
        name: string,
        product: string,
        price: number,
        stock: number,
        shop: string,
    ) {
        this.name = name;
        this.product = product;
        this.price = price;
        this.stock = stock;
        this.shop = shop;
    }
}
