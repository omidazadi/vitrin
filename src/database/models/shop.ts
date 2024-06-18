export class Shop {
    public name: string;
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
    public supportUsername: string | null;
    public cardNumber: string | null;
    public cardOwner: string | null;
    public beforePurchaseMessage: string | null;
    public afterPurchaseMessage: string | null;
    public purchaseChannelTid: string | null;
    public owner: number;

    constructor(
        name: string,
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
        supportUsername: string | null,
        cardNumber: string | null,
        cardOwner: string | null,
        beforePurchaseMessage: string | null,
        afterPurchaseMessage: string | null,
        purchaseChannelTid: string | null,
        owner: number,
    ) {
        this.name = name;
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
        this.supportUsername = supportUsername;
        this.cardNumber = cardNumber;
        this.cardOwner = cardOwner;
        this.beforePurchaseMessage = beforePurchaseMessage;
        this.afterPurchaseMessage = afterPurchaseMessage;
        this.purchaseChannelTid = purchaseChannelTid;
        this.owner = owner;
    }
}
