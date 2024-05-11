import { ShopState } from 'src/bots/shop/state';
export declare class Customer {
    id: number;
    tid: string;
    data: Customer.Data;
    firstName: string | null;
    lastName: string | null;
    address: string | null;
    zipCode: string | null;
    referral: string | null;
    maintenanceVersion: number;
    shop: number;
    constructor(id: number, tid: string, data: Customer.Data, firstName: string | null, lastName: string | null, address: string | null, zipCode: string | null, referral: string | null, maintenanceVersion: number, shop: number);
}
export declare namespace Customer {
    type Data = {
        state: ShopState;
        [key: string]: any;
    };
}
