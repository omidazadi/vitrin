import { Context as GrammyContext, Bot as GrammyBot } from 'grammy';
import { ContextManager } from 'src/infrastructures/context/context-manager';
import { DatabaseManager } from 'src/infrastructures/database-manager';
import { GatewayInterface } from 'src/infrastructures/interfaces/gateway';
import { Logger } from 'src/infrastructures/logger';
import { ShopRootRouter } from './routers/root-router';
import { Customer } from '../../database/models/customer';
import { ShopInternalErrorHandler } from './handlers/common/internal-error';
import { ShopUnknownErrorHandler } from './handlers/common/unknown-error';
import { ShopUnsupportedMediaErrorHandler } from './handlers/common/unsupported-media-error';
import { MediaNotAllowedError } from 'src/infrastructures/errors/media-now-allowed-error';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopRepository } from 'src/database/repositories/shop-repository';
import { Inject } from '@nestjs/common';
import { PoolClient } from 'pg';

export class ShopGateway implements GatewayInterface {
    private shopName: string;
    private grammyBot: GrammyBot;
    private contextManager: ContextManager<Customer>;
    private databaseManager: DatabaseManager;
    private router: ShopRootRouter;
    private logger: Logger;
    private internalErrorHandler: ShopInternalErrorHandler;
    private unknownErrorHandler: ShopUnknownErrorHandler;
    private unsupportedMediaErrorHandler: ShopUnsupportedMediaErrorHandler;
    private shopRepository: ShopRepository;

    public constructor(
        @Inject('NAME') shopName: string,
        grammyBot: GrammyBot,
        contextManager: ContextManager<Customer>,
        databaseManager: DatabaseManager,
        router: ShopRootRouter,
        logger: Logger,
        internalErrorHandler: ShopInternalErrorHandler,
        unknownErrorHandler: ShopUnknownErrorHandler,
        unsupportedMediaErrorHandler: ShopUnsupportedMediaErrorHandler,
        shopRepository: ShopRepository,
    ) {
        this.shopName = shopName;
        this.grammyBot = grammyBot;
        this.contextManager = contextManager;
        this.databaseManager = databaseManager;
        this.router = router;
        this.logger = logger;
        this.internalErrorHandler = internalErrorHandler;
        this.unknownErrorHandler = unknownErrorHandler;
        this.unsupportedMediaErrorHandler = unsupportedMediaErrorHandler;
        this.shopRepository = shopRepository;
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
        let requestContext: RequestContext<Customer>;
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
                requestContext.telegramContext.text === null &&
                requestContext.telegramContext.photo === null &&
                requestContext.telegramContext.video === null
            ) {
                await this.unsupportedMediaErrorHandler.handle(
                    requestContext as RequestContext<Customer>,
                );
                await this.databaseManager.rollbackTransaction(
                    requestContext.poolClient,
                );
                return;
            }

            const isMatched = await this.router.route(requestContext);
            await this.databaseManager.commitTransaction(
                requestContext.poolClient,
            );

            if (!isMatched) {
                await this.unknownErrorHandler.handle(requestContext);
                return;
            }
        } catch (e: unknown) {
            if (e instanceof MediaNotAllowedError) {
                await this.unknownErrorHandler.handle(requestContext);
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
