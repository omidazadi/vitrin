export class Purchase {
    public uid: string;
    public paymentUid: string;
    public customerReceiptTid: string | null;
    public shopReceiptTid: string | null;
    public customer: number | null;
    public recipientFirstName: string;
    public recipientLastName: string;
    public recipientPhoneNumber: string;
    public recipientAddress: string;
    public recipientZipCode: string;
    public status: 'pending' | 'canceled' | 'paid' | 'delivered';
    public trackingNumbers: Array<string> | null;
    public referral: string | null;
    public referralFee: number;
    public referralDepositStatementUid: string | null;
    public shippingFee: number;
    public sum: number;
    public createdAt: Date;
    public shop: string | null;

    constructor(
        uid: string,
        paymentUid: string,
        customerReceiptTid: string | null,
        shopReceiptTid: string | null,
        customer: number | null,
        recipientFirstName: string,
        recipientLastName: string,
        recipientPhoneNumber: string,
        recipientAddress: string,
        recipientZipCode: string,
        status: 'pending' | 'canceled' | 'paid' | 'delivered',
        trackingNumbers: Array<string> | null,
        referral: string | null,
        referralFee: number,
        referralDepositStatementUid: string | null,
        shippingFee: number,
        sum: number,
        createdAt: Date,
        shop: string | null,
    ) {
        this.uid = uid;
        this.paymentUid = paymentUid;
        this.customerReceiptTid = customerReceiptTid;
        this.shopReceiptTid = shopReceiptTid;
        this.customer = customer;
        this.recipientFirstName = recipientFirstName;
        this.recipientLastName = recipientLastName;
        this.recipientPhoneNumber = recipientPhoneNumber;
        this.recipientAddress = recipientAddress;
        this.recipientZipCode = recipientZipCode;
        this.status = status;
        this.trackingNumbers = trackingNumbers;
        this.referral = referral;
        this.referralFee = referralFee;
        this.referralDepositStatementUid = referralDepositStatementUid;
        this.shippingFee = shippingFee;
        this.sum = sum;
        this.createdAt = createdAt;
        this.shop = shop;
    }
}
