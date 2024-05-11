import { VitrinState } from 'src/bots/vitrin/state';
export declare class Visitor {
    id: number;
    tid: string;
    data: Visitor.Data;
    constructor(id: number, tid: string, data: Visitor.Data);
}
export declare namespace Visitor {
    type Data = {
        state: VitrinState;
        [key: string]: any;
    };
}
