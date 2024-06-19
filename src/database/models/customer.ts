import { ShopState } from 'src/bots/shop/state';

export class Customer {
    public id: number;
    public tid: string;
    public data: Customer.Data;
    public firstName: string | null;
    public lastName: string | null;
    public phoneNumber: string | null;
    public address: string | null;
    public zipCode: string | null;
    public referral: string | null;
    public maintenanceVersion: number;
    public shop: string;

    constructor(
        id: number,
        tid: string,
        data: Customer.Data,
        firstName: string | null,
        lastName: string | null,
        phoneNumber: string | null,
        address: string | null,
        zipCode: string | null,
        referral: string | null,
        maintenanceVersion: number,
        shop: string,
    ) {
        this.id = id;
        this.tid = tid;
        this.data = data;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.address = address;
        this.zipCode = zipCode;
        this.referral = referral;
        this.maintenanceVersion = maintenanceVersion;
        this.shop = shop;
    }
}

export namespace Customer {
    export type Data = {
        state: ShopState;
        [key: string]: any;
    };
}
