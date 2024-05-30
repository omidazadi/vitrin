export class OptionVariety {
    public value: string;
    public option: string;
    public variety: string;
    public product: string;
    public shop: string;

    constructor(
        value: string,
        option: string,
        variety: string,
        product: string,
        shop: string,
    ) {
        this.value = value;
        this.option = option;
        this.variety = variety;
        this.product = product;
        this.shop = shop;
    }
}
