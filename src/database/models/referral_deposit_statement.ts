export class ReferralDepositStatement {
    public uid: string;
    public paymentUid: string;
    public referral: string | null;
    public sum: number;
    public createdAt: Date;
    public shop: string | null;

    constructor(
        uid: string,
        paymentUid: string,
        referral: string | null,
        sum: number,
        createdAt: Date,
        shop: string | null,
    ) {
        this.uid = uid;
        this.paymentUid = paymentUid;
        this.referral = referral;
        this.sum = sum;
        this.createdAt = createdAt;
        this.shop = shop;
    }
}
