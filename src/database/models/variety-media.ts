export class VarietyMedia {
    public name: string;
    public variety: string;
    public product: string;
    public fileTid: string;
    public isMain: boolean;
    public shop: string;

    constructor(
        name: string,
        variety: string,
        product: string,
        fileTid: string,
        isMain: boolean,
        shop: string,
    ) {
        this.name = name;
        this.variety = variety;
        this.product = product;
        this.fileTid = fileTid;
        this.isMain = isMain;
        this.shop = shop;
    }
}
