import { Context as GrammyContext } from 'grammy';

export interface GatewayInterface {
    initialize(data: any): Promise<void>;
    recieve(grammyContext: GrammyContext): Promise<void>;
}
