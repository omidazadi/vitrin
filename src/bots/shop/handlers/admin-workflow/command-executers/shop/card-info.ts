import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { Shop } from 'src/database/models/shop';
import { ShopRepository } from 'src/database/repositories/shop-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';

@Injectable()
export class ShopAdminWorkflowShopCardInfoCommandExecuter {
    private frontend: HydratedFrontend;
    private shopRepository: ShopRepository;

    public constructor(
        frontend: HydratedFrontend,
        shopRepository: ShopRepository,
    ) {
        this.frontend = frontend;
        this.shopRepository = shopRepository;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'set') {
            await this.setCardInfo(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'show') {
            await this.showCardInfo(
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
    public async setCardInfo(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 0 && tokens.length !== 3) {
            await this.error(requestContext);
            return;
        }

        const shop = instanceToInstance(requestContext.user.shop);
        if (tokens.length === 0) {
            shop.supportUsername = null;
            shop.cardNumber = null;
            shop.cardOwner = null;
        } else {
            shop.supportUsername = tokens[0];
            shop.cardNumber = tokens[1];
            shop.cardOwner = tokens[2];
        }

        await this.shopRepository.updateShop(shop, requestContext.poolClient);
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: await this.makeCardInfo(requestContext, shop),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showCardInfo(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 0) {
            await this.error(requestContext);
            return;
        }

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: await this.makeCardInfo(
                        requestContext,
                        requestContext.user.shop,
                    ),
                },
            },
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

    private async makeCardInfo(
        requestContext: RequestContext<ShopCustomer>,
        shop: Shop,
    ): Promise<string> {
        return `Support:@${shop.supportUsername}\n\nCard Number:${shop.cardNumber}\n\nCard Owner:${shop.cardOwner}`;
    }
}
