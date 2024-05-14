import { Context as GrammyContext } from 'grammy';

export interface GatewayInterface {
    preInitialize(preInitializeData: any): Promise<void>;
    postInitialize(postInitializeData: any): Promise<void>;
    recieve(grammyContext: GrammyContext): Promise<void>;
}
