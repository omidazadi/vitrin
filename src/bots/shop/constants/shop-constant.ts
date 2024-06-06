class ShopConstant {
    public cartSize: number;
    public shippingFee: number;

    public constructor() {
        this.cartSize = 10;
        this.shippingFee = 50000;
    }
}

export const shopConstant = new ShopConstant();
