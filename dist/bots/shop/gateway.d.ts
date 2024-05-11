import { Context as GrammyContext } from 'grammy';
import { ContextManager } from 'src/infrastructures/context/context-manager';
import { DatabaseManager } from 'src/infrastructures/database-manager';
import { GatewayInterface } from 'src/infrastructures/interfaces/gateway';
import { Logger } from 'src/infrastructures/logger';
import { ShopRootRouter } from './routers/root-router';
import { Customer } from '../../database/models/customer';
export declare class ShopGateway implements GatewayInterface {
    private contextManager;
    private databaseManager;
    private router;
    private logger;
    constructor(contextManager: ContextManager<Customer>, databaseManager: DatabaseManager, router: ShopRootRouter, logger: Logger);
    initialize(): Promise<void>;
    recieve(grammyContext: GrammyContext): Promise<void>;
}
