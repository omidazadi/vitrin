class ShopConstant {
    public cartSize: number;
    public shippingFee: number;
    public uidLength: number;
    public purchaseDurationMinutes: number;

    public constructor() {
        this.cartSize = 10;
        this.shippingFee = 50000;
        this.uidLength = 21;
        this.purchaseDurationMinutes = 15;
    }
}

export const shopConstant = new ShopConstant();
