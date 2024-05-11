export declare class Section {
    name: string;
    fullName: string;
    description: string;
    fileTid: string;
    parent: string | null;
    rank: number | null;
    newLine: boolean | null;
    shop: string;
    constructor(name: string, fullName: string, description: string, fileTid: string, parent: string, rank: number, newLine: boolean, shop: string);
}
