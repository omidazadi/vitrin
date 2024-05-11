import { Context as GrammyContext } from 'grammy';
import { RequestContext } from './request-context';
import { DatabaseManager } from '../database-manager';
import { TelegramContext } from './telegram-context';
import { UserBuilderInterface } from '../interfaces/user-builder';
export declare class ContextManager<T> {
    private databaseManager;
    private userBuilder;
    constructor(databaseManager: DatabaseManager, userBuilder: UserBuilderInterface<T>);
    buildRequestContext(grammyContext: GrammyContext): Promise<RequestContext<T>>;
    buildTelegramContext(grammyContext: GrammyContext): TelegramContext;
}
