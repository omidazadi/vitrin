export class Shop {
    public name: string;
    public fullName: string;
    public tid: string | null;
    public botToken: string;
    public onMaintenance: boolean;
    public maintenanceVersion: number;
    public mainDescription: string | null;
    public mainFileTid: string | null;
    public aboutDescription: string | null;
    public aboutFileTid: string | null;
    public faqDescription: string | null;
    public faqFileTid: string | null;
    public owner: number;

    constructor(
        name: string,
        fullName: string,
        tid: string | null,
        botToken: string,
        onMaintenance: boolean,
        maintenanceVersion: number,
        mainDescription: string | null,
        mainFileTid: string | null,
        aboutDescription: string | null,
        aboutFileTid: string | null,
        faqDescription: string | null,
        faqFileTid: string | null,
        owner: number,
    ) {
        this.name = name;
        this.fullName = fullName;
        this.tid = tid;
        this.botToken = botToken;
        this.onMaintenance = onMaintenance;
        this.maintenanceVersion = maintenanceVersion;
        this.mainDescription = mainDescription;
        this.mainFileTid = mainFileTid;
        this.aboutDescription = aboutDescription;
        this.aboutFileTid = aboutFileTid;
        this.faqDescription = faqDescription;
        this.faqFileTid = faqFileTid;
        this.owner = owner;
    }
}
