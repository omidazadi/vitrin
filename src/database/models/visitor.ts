import { VitrinState } from 'src/bots/vitrin/state';

export class Visitor {
    public id: number;
    public tid: string;
    public data: Visitor.Data;

    constructor(id: number, tid: string, data: Visitor.Data) {
        this.id = id;
        this.tid = tid;
        this.data = data;
    }
}

export namespace Visitor {
    export type Data = {
        state: VitrinState;
        [key: string]: any;
    };
}
