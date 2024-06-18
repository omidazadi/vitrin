export class Payment {
    public uid: string;
    public type: 'to-shop' | 'to-referral' | 'to-owner';
    public method: 'manual';
    public status: 'pending' | 'accepted' | 'rejected';
    public sum: number;
    public createdAt: Date;

    constructor(
        uid: string,
        type: 'to-shop' | 'to-referral' | 'to-owner',
        method: 'manual',
        status: 'pending' | 'accepted' | 'rejected',
        sum: number,
        createdAt: Date,
    ) {
        this.uid = uid;
        this.type = type;
        this.method = method;
        this.status = status;
        this.sum = sum;
        this.createdAt = createdAt;
    }
}
