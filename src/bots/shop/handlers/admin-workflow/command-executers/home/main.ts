import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { ShopRepository } from 'src/database/repositories/shop-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';

@Injectable()
export class ShopAdminWorkflowHomeMainCommandExecuter {
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
            await this.setFaq(requestContext, tokens.slice(1, tokens.length));
        } else if (tokens[0] === 'show') {
            await this.showFaq(requestContext, tokens.slice(1, tokens.length));
        } else {
            await this.error(requestContext);
        }
    }

    @allowedMedia({
        photo: 'allowed',
        video: 'prohibited',
    })
    public async setFaq(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 0 && tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        if (tokens.length === 0) {
            requestContext.user.shop.mainDescription = null;
        } else {
            requestContext.user.shop.mainDescription = tokens[0];
        }
        if (requestContext.telegramContext.photo === null) {
            requestContext.user.shop.mainFileTid = null;
        } else {
            requestContext.user.shop.mainFileTid =
                requestContext.telegramContext.photo;
        }
        await this.shopRepository.updateShop(
            requestContext.user.shop,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                photo:
                    requestContext.user.shop.mainFileTid === null
                        ? undefined
                        : requestContext.user.shop.mainFileTid,
                context: {
                    scenario: 'plain',
                    message: requestContext.user.shop.mainDescription,
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showFaq(
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
                photo:
                    requestContext.user.shop.mainFileTid === null
                        ? undefined
                        : requestContext.user.shop.mainFileTid,
                context: {
                    scenario: 'plain',
                    message: requestContext.user.shop.mainDescription,
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
}
