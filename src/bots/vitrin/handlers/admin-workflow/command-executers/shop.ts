import { INestApplicationContext, Inject, Injectable } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Bot as GrammyBot } from 'grammy';
import { ShopModule } from 'src/bots/shop/module';
import { Visitor } from 'src/database/models/visitor';
import { ShopRepository } from 'src/database/repositories/shop-repository';
import { VisitorRepository } from 'src/database/repositories/visitor-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { BotRunner } from 'src/infrastructures/bot-runner';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { Logger } from 'src/infrastructures/logger';

@Injectable()
export class VitrinAdminWorkflowShopCommandExecuter {
    private frontend: HydratedFrontend;
    private logger: Logger;
    private shopRepository: ShopRepository;
    private visitorRepository: VisitorRepository;
    private runningShops: { [name: string]: INestApplicationContext };

    public constructor(
        frontend: HydratedFrontend,
        logger: Logger,
        shopRepository: ShopRepository,
        visitorRepository: VisitorRepository,
        @Inject('RUNNING_SHOPS')
        runningShops: { [name: string]: INestApplicationContext },
    ) {
        this.frontend = frontend;
        this.logger = logger;
        this.shopRepository = shopRepository;
        this.visitorRepository = visitorRepository;
        this.runningShops = runningShops;
    }

    public async handle(
        requestContext: RequestContext<Visitor>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'create') {
            await this.createShop(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'delete') {
            await this.deleteShop(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else {
            await this.error(requestContext);
        }
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async createShop(
        requestContext: RequestContext<Visitor>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 4) {
            await this.error(requestContext);
            return;
        }

        const visitor = await this.visitorRepository.getVisitorByTid(
            tokens[3],
            requestContext.poolClient,
        );
        if (visitor === null) {
            await this.error(requestContext);
            return;
        }

        const shop = await this.shopRepository.createShop(
            tokens[0],
            tokens[1],
            null,
            tokens[2],
            false,
            1,
            null,
            null,
            null,
            null,
            null,
            null,
            visitor.id,
            requestContext.poolClient,
        );

        const shopModule = ShopModule.register({
            name: shop.name,
            botToken: shop.botToken,
        });
        this.runningShops[shop.name] =
            await NestFactory.createApplicationContext(shopModule);
        const botRunner = this.runningShops[shop.name].get(BotRunner);
        try {
            await botRunner.run(null, {
                poolClient: requestContext.poolClient,
            });
        } catch (e: unknown) {
            await this.logger.warn(e!.toString());
            await this.shopRepository.deleteShop(
                shop.name,
                requestContext.poolClient,
            );
            const grammyBot = this.runningShops[shop.name].get(GrammyBot);
            await grammyBot.stop();
            await this.runningShops[shop.name].close();
            delete this.runningShops[shop.name];
            await this.error(requestContext);
            return;
        }

        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'admin-workflow/command',
            { context: { scenario: 'done' } },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async deleteShop(
        requestContext: RequestContext<Visitor>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        const shop = await this.shopRepository.getShop(
            tokens[0],
            requestContext.poolClient,
        );
        if (shop === null) {
            await this.error(requestContext);
            return;
        }
        if (!(shop.name in this.runningShops)) {
            await this.error(requestContext);
            return;
        }

        await this.shopRepository.deleteShop(
            shop.name,
            requestContext.poolClient,
        );
        const grammyBot = this.runningShops[shop.name].get(GrammyBot);
        await grammyBot.stop();
        await this.runningShops[shop.name].close();
        delete this.runningShops[shop.name];

        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'admin-workflow/command',
            { context: { scenario: 'done' } },
        );
    }

    private async error(requestContext: RequestContext<Visitor>) {
        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'admin-workflow/command',
            { context: { scenario: 'error' } },
        );
    }
}
