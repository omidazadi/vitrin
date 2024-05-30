export class Product {
    public name: string;
    public fullName: string;
    public description: string;
    public createdAt: Date;
    public shop: string;

    constructor(
        name: string,
        fullName: string,
        description: string,
        createdAt: Date,
        shop: string,
    ) {
        this.name = name;
        this.fullName = fullName;
        this.description = description;
        this.createdAt = createdAt;
        this.shop = shop;
    }
}
