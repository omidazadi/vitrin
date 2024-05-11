export class ProductMedia {
    public id: number;
    public product: string;
    public fileTid: string;
    public isMain: boolean;
    public shop: string;

    constructor(
        id: number,
        product: string,
        fileTid: string,
        isMain: boolean,
        shop: string,
    ) {
        this.id = id;
        this.product = product;
        this.fileTid = fileTid;
        this.isMain = isMain;
        this.shop = shop;
    }
}
