export class Section {
    public name: string;
    public fullName: string;
    public description: string;
    public fileTid: string | null;
    public parent: string | null;
    public rank: number;
    public newLine: boolean;
    public shop: string;

    constructor(
        name: string,
        fullName: string,
        description: string,
        fileTid: string | null,
        parent: string | null,
        rank: number,
        newLine: boolean,
        shop: string,
    ) {
        this.name = name;
        this.fullName = fullName;
        this.description = description;
        this.fileTid = fileTid;
        this.parent = parent;
        this.rank = rank;
        this.newLine = newLine;
        this.shop = shop;
    }
}
