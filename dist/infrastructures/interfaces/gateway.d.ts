import { Context as GrammyContext } from 'grammy';
export interface GatewayInterface {
    initialize(): Promise<void>;
    recieve(grammyContext: GrammyContext): Promise<void>;
}
