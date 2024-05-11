import { Context as GrammyContext } from 'grammy';
import { ContextManager } from 'src/infrastructures/context/context-manager';
import { DatabaseManager } from 'src/infrastructures/database-manager';
import { GatewayInterface } from 'src/infrastructures/interfaces/gateway';
import { Logger } from 'src/infrastructures/logger';
import { ShopRootRouter } from './routers/root-router';
import { Customer } from '../../database/models/customer';

export class ShopGateway implements GatewayInterface {
    private contextManager: ContextManager<Customer>;
    private databaseManager: DatabaseManager;
    private router: ShopRootRouter;
    private logger: Logger;

    public constructor(
        contextManager: ContextManager<Customer>,
        databaseManager: DatabaseManager,
        router: ShopRootRouter,
        logger: Logger,
    ) {
        this.contextManager = contextManager;
        this.databaseManager = databaseManager;
        this.router = router;
        this.logger = logger;
    }

    public async initialize(): Promise<void> {}

    public async recieve(grammyContext: GrammyContext): Promise<void> {
        const requestContext =
            await this.contextManager.buildRequestContext(grammyContext);
        try {
            await this.router.route(requestContext);
            await this.databaseManager.commitTransaction(
                requestContext.poolClient,
            );
        } catch (e: unknown) {
            await this.logger.warn(e!.toString());
            await this.databaseManager.rollbackTransaction(
                requestContext.poolClient,
            );

            requestContext.poolClient =
                await this.databaseManager.createTransaction();
            await this.router.internalError(requestContext);
            await this.databaseManager.commitTransaction(
                requestContext.poolClient,
            );
        }
    }
}
