import { INestApplicationContext, Inject, Injectable } from '@nestjs/common';
import { Context as GrammyContext } from 'grammy';
import { ContextManager } from 'src/infrastructures/context/context-manager';
import { DatabaseManager } from 'src/infrastructures/database-manager';
import { GatewayInterface } from 'src/infrastructures/interfaces/gateway';
import { Logger } from 'src/infrastructures/logger';
import { VitrinRootRouter } from './routers/root-router';
import { Visitor } from 'src/database/models/visitor';
import { VitrinInternalErrorHandler } from './handlers/common/internal-error';
import { VitrinUnknownErrorHandler } from './handlers/common/unknown-error';
import { VitrinUnsupportedMediaErrorHandler } from './handlers/common/unsupported-media-error';
import { MediaNotAllowedError } from 'src/infrastructures/errors/media-now-allowed-error';
import { ShopRepository } from 'src/database/repositories/shop-repository';
import { ShopModule } from '../shop/module';
import { NestFactory } from '@nestjs/core';
import { BotRunner } from 'src/infrastructures/bot-runner';

@Injectable()
export class VitrinGateway implements GatewayInterface {
    private contextManager: ContextManager<Visitor>;
    private databaseManager: DatabaseManager;
    private router: VitrinRootRouter;
    private logger: Logger;
    private internalErrorHandler: VitrinInternalErrorHandler;
    private unknownErrorHandler: VitrinUnknownErrorHandler;
    private unsupportedMediaErrorHandler: VitrinUnsupportedMediaErrorHandler;
    private shopRepository: ShopRepository;
    runningShops: { [name: string]: INestApplicationContext };

    public constructor(
        contextManager: ContextManager<Visitor>,
        databaseManager: DatabaseManager,
        router: VitrinRootRouter,
        logger: Logger,
        internalErrorHandler: VitrinInternalErrorHandler,
        unknownErrorHandler: VitrinUnknownErrorHandler,
        unsupportedMediaErrorHandler: VitrinUnsupportedMediaErrorHandler,
        shopRepository: ShopRepository,
        @Inject('RUNNING_SHOPS')
        runningShops: { [name: string]: INestApplicationContext },
    ) {
        this.contextManager = contextManager;
        this.databaseManager = databaseManager;
        this.router = router;
        this.logger = logger;
        this.internalErrorHandler = internalErrorHandler;
        this.unknownErrorHandler = unknownErrorHandler;
        this.unsupportedMediaErrorHandler = unsupportedMediaErrorHandler;
        this.shopRepository = shopRepository;
        this.runningShops = runningShops;
    }

    public async preInitialize(preInitializeData: any): Promise<void> {}
    public async postInitialize(postInitializeData: any): Promise<void> {
        const poolClient = await this.databaseManager.createTransaction();
        const shops = await this.shopRepository.getAllShops(poolClient);
        for (const shop of shops) {
            const shopModule = ShopModule.register({
                name: shop.name,
                botToken: shop.botToken,
            });
            this.runningShops[shop.name] =
                await NestFactory.createApplicationContext(shopModule);
            const botRunner = this.runningShops[shop.name].get(BotRunner);
            await botRunner.run(null, { poolClient: poolClient });
        }
        await this.databaseManager.commitTransaction(poolClient);
    }

    public async recieve(grammyContext: GrammyContext): Promise<void> {
        const requestContext =
            await this.contextManager.buildRequestContext(grammyContext);
        try {
            if (
                requestContext.telegramContext.text === null &&
                requestContext.telegramContext.photo === null &&
                requestContext.telegramContext.video === null
            ) {
                await this.unsupportedMediaErrorHandler.handle(requestContext);
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
