import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { ShopAdminWorkflowShopAfterPurchaseMessageCommandExecuter } from './after-purchase-message';
import { ShopAdminWorkflowShopBeforePurchaseMessageCommandExecuter } from './before-purchase-message';
import { ShopAdminWorkflowShopCardInfoCommandExecuter } from './card-info';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { instanceToInstance } from 'class-transformer';
import { ShopRepository } from 'src/database/repositories/shop-repository';

@Injectable()
export class ShopAdminWorkflowShopCommandExecuter {
    private frontend: HydratedFrontend;
    private afterPurchaseMessageCommandExecuter: ShopAdminWorkflowShopAfterPurchaseMessageCommandExecuter;
    private beforePurchaseMessageCommandExecuter: ShopAdminWorkflowShopBeforePurchaseMessageCommandExecuter;
    private cardInfoCommandExecuter: ShopAdminWorkflowShopCardInfoCommandExecuter;
    private shopRepository: ShopRepository;

    public constructor(
        frontend: HydratedFrontend,
        afterPurchaseMessageCommandExecuter: ShopAdminWorkflowShopAfterPurchaseMessageCommandExecuter,
        beforePurchaseMessageCommandExecuter: ShopAdminWorkflowShopBeforePurchaseMessageCommandExecuter,
        cardInfoCommandExecuter: ShopAdminWorkflowShopCardInfoCommandExecuter,
        shopRepository: ShopRepository,
    ) {
        this.frontend = frontend;
        this.afterPurchaseMessageCommandExecuter =
            afterPurchaseMessageCommandExecuter;
        this.beforePurchaseMessageCommandExecuter =
            beforePurchaseMessageCommandExecuter;
        this.cardInfoCommandExecuter = cardInfoCommandExecuter;
        this.shopRepository = shopRepository;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'card-info') {
            await this.cardInfoCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'before-purchase-message') {
            await this.beforePurchaseMessageCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'after-purchase-message') {
            await this.afterPurchaseMessageCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'set-purchase-channel') {
            await this.setPurchaseChannel(
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
    public async setPurchaseChannel(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 0 && tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        const shop = instanceToInstance(requestContext.user.shop);
        if (tokens.length === 0) {
            shop.purchaseChannelTid = null;
        } else {
            shop.purchaseChannelTid = tokens[0];
        }

        await this.shopRepository.updateShop(shop, requestContext.poolClient);
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            { context: { scenario: 'done' } },
        );
    }

    private async error(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<never> {
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            { context: { scenario: 'error' } },
        );
        throw new ExpectedError();
    }
}
