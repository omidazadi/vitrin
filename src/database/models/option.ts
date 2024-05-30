export class Option {
    public name: string;
    public fullName: string;
    public fullButton: string;
    public fileTid: string | null;
    public product: string;
    public shop: string;

    constructor(
        name: string,
        fullName: string,
        fullButton: string,
        fileTid: string | null,
        product: string,
        shop: string,
    ) {
        this.name = name;
        this.fullName = fullName;
        this.fullButton = fullButton;
        this.fileTid = fileTid;
        this.product = product;
        this.shop = shop;
    }
}
