import { Context as GrammyContext, Bot as GrammyBot } from 'grammy';
import { ContextManager } from 'src/infrastructures/context/context-manager';
import { DatabaseManager } from 'src/infrastructures/database-manager';
import { GatewayInterface } from 'src/infrastructures/interfaces/gateway';
import { Logger } from 'src/infrastructures/logger';
import { ShopRootRouter } from './routers/root-router';
import { ShopInternalErrorHandler } from './handlers/common/internal-error';
import { ShopUnknownErrorHandler } from './handlers/common/unknown-error';
import { ShopUnsupportedMediaErrorHandler } from './handlers/common/unsupported-media-error';
import { MediaNotAllowedError } from 'src/infrastructures/errors/media-now-allowed-error';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopRepository } from 'src/database/repositories/shop-repository';
import { Inject } from '@nestjs/common';
import { PoolClient } from 'pg';
import { ShopOnMaintenanceHandler } from './handlers/common/on-maintenance';
import { ShopUpdatedHandler } from './handlers/common/updated';
import { VisitorRepository } from 'src/database/repositories/visitor-repository';
import { ShopCustomer } from './user-builder';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';

export class ShopGateway implements GatewayInterface {
    private shopName: string;
    private grammyBot: GrammyBot;
    private contextManager: ContextManager<ShopCustomer>;
    private databaseManager: DatabaseManager;
    private router: ShopRootRouter;
    private logger: Logger;
    private internalErrorHandler: ShopInternalErrorHandler;
    private onMaintenanceHandler: ShopOnMaintenanceHandler;
    private unknownErrorHandler: ShopUnknownErrorHandler;
    private unsupportedMediaErrorHandler: ShopUnsupportedMediaErrorHandler;
    private updatedHandler: ShopUpdatedHandler;
    private shopRepository: ShopRepository;
    private visitorRepository: VisitorRepository;

    public constructor(
        @Inject('NAME') shopName: string,
        grammyBot: GrammyBot,
        contextManager: ContextManager<ShopCustomer>,
        databaseManager: DatabaseManager,
        router: ShopRootRouter,
        logger: Logger,
        internalErrorHandler: ShopInternalErrorHandler,
        onMaintenanceHandler: ShopOnMaintenanceHandler,
        unknownErrorHandler: ShopUnknownErrorHandler,
        unsupportedMediaErrorHandler: ShopUnsupportedMediaErrorHandler,
        updatedHandler: ShopUpdatedHandler,
        shopRepository: ShopRepository,
        visitorRepository: VisitorRepository,
    ) {
        this.shopName = shopName;
        this.grammyBot = grammyBot;
        this.contextManager = contextManager;
        this.databaseManager = databaseManager;
        this.router = router;
        this.logger = logger;
        this.internalErrorHandler = internalErrorHandler;
        this.onMaintenanceHandler = onMaintenanceHandler;
        this.unknownErrorHandler = unknownErrorHandler;
        this.unsupportedMediaErrorHandler = unsupportedMediaErrorHandler;
        this.updatedHandler = updatedHandler;
        this.shopRepository = shopRepository;
        this.visitorRepository = visitorRepository;
    }

    public async preInitialize(preInitializeData: any): Promise<void> {}

    public async postInitialize(postInitializeData: any): Promise<void> {
        if (!(await this.logger.isJoinedInLogChannel())) {
            throw new Error('Bot is not joined in the log channel.');
        }

        const poolClient = postInitializeData.poolClient as PoolClient;
        const shop = await this.shopRepository.getShopForce(
            this.shopName,
            poolClient,
        );
        if (shop.tid === null) {
            shop.tid = this.grammyBot.botInfo.id.toString();
            await this.shopRepository.updateShop(shop, poolClient);
        }
    }

    public async recieve(grammyContext: GrammyContext): Promise<void> {
        let requestContext: RequestContext<ShopCustomer>;
        try {
            requestContext =
                await this.contextManager.buildRequestContext(grammyContext);
        } catch (e: unknown) {
            await this.logger.warn(
                'Shop does not seem to be loaded correctly.',
            );
            return;
        }

        try {
            if (
                requestContext.user.shop.onMaintenance &&
                requestContext.user.customer.tid !==
                    (
                        await this.visitorRepository.getVisitorForce(
                            requestContext.user.shop.owner,
                            requestContext.poolClient,
                        )
                    ).tid
            ) {
                await this.onMaintenanceHandler.handle(requestContext);
                await this.databaseManager.commitTransaction(
                    requestContext.poolClient,
                );
                return;
            }

            if (
                !requestContext.user.shop.onMaintenance &&
                requestContext.user.customer.maintenanceVersion <
                    requestContext.user.shop.maintenanceVersion
            ) {
                await this.updatedHandler.handle(requestContext);
                await this.databaseManager.commitTransaction(
                    requestContext.poolClient,
                );
                return;
            }
        } catch (e: unknown) {
            await this.databaseManager.rollbackTransaction(
                requestContext.poolClient,
            );
            await this.logger.warn(
                'Shop does not seem to be loaded correctly.',
            );
            return;
        }

        try {
            if (
                requestContext.telegramContext.text === null &&
                requestContext.telegramContext.photo === null &&
                requestContext.telegramContext.video === null
            ) {
                await this.unsupportedMediaErrorHandler.handle(
                    requestContext as RequestContext<ShopCustomer>,
                );
                await this.databaseManager.rollbackTransaction(
                    requestContext.poolClient,
                );
                return;
            }

            const isMatched = await this.router.route(requestContext);
            if (isMatched) {
                await this.databaseManager.commitTransaction(
                    requestContext.poolClient,
                );
            } else {
                await this.unknownErrorHandler.handle(requestContext);
                await this.databaseManager.rollbackTransaction(
                    requestContext.poolClient,
                );
            }
        } catch (e: unknown) {
            if (e instanceof MediaNotAllowedError) {
                await this.unknownErrorHandler.handle(requestContext);
                await this.databaseManager.rollbackTransaction(
                    requestContext.poolClient,
                );
                return;
            } else if (e instanceof ExpectedError) {
                await this.databaseManager.rollbackTransaction(
                    requestContext.poolClient,
                );
                return;
            }

            await this.logger.warn(e!.toString());
            await this.databaseManager.rollbackTransaction(
                requestContext.poolClient,
            );

            requestContext.poolClient =
                await this.databaseManager.createTransaction();
            await this.internalErrorHandler.handle(requestContext);
            await this.databaseManager.commitTransaction(
                requestContext.poolClient,
            );
        }
    }
}
