export declare class Shop {
    name: string;
    fullName: string;
    botUsername: string;
    botToken: string;
    onMaintenance: boolean;
    maintenanceVersion: number;
    mainDescription: string | null;
    mainFileTid: string | null;
    aboutDescription: string | null;
    aboutFileTid: string | null;
    faqDescription: string | null;
    faqFileTid: string | null;
    owner: number;
    constructor(name: string, fullName: string, botUsername: string, botToken: string, onMaintenance: boolean, maintenanceVersion: number, mainDescription: string | null, mainFileTid: string | null, aboutDescription: string | null, aboutFileTid: string | null, faqDescription: string | null, faqFileTid: string | null, owner: number);
}
