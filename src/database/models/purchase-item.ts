export class PurchaseItem {
    public purchaseUid: string;
    public product: string | null;
    public variety: string | null;
    public itemFullName: string;
    public price: number;
    public createdAt: Date;
    public shop: string | null;

    constructor(
        purchaseUid: string,
        product: string | null,
        variety: string | null,
        itemFullName: string,
        price: number,
        createdAt: Date,
        shop: string | null,
    ) {
        this.purchaseUid = purchaseUid;
        this.product = product;
        this.variety = variety;
        this.itemFullName = itemFullName;
        this.price = price;
        this.createdAt = createdAt;
        this.shop = shop;
    }
}
