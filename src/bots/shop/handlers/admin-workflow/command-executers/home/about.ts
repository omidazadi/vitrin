import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { ShopRepository } from 'src/database/repositories/shop-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';

@Injectable()
export class ShopAdminWorkflowHomeAboutCommandExecuter {
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
            await this.setAbout(requestContext, tokens.slice(1, tokens.length));
        } else if (tokens[0] === 'show') {
            await this.showAbout(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else {
            await this.error(requestContext);
        }
    }

    @allowedMedia({
        photo: 'allowed',
        video: 'prohibited',
    })
    public async setAbout(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 0 && tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        if (tokens.length === 0) {
            requestContext.user.shop.aboutDescription = null;
        } else {
            requestContext.user.shop.aboutDescription = tokens[0];
        }
        if (requestContext.telegramContext.photo === null) {
            requestContext.user.shop.aboutFileTid = null;
        } else {
            requestContext.user.shop.aboutFileTid =
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
                    requestContext.user.shop.aboutFileTid === null
                        ? undefined
                        : requestContext.user.shop.aboutFileTid,
                context: {
                    scenario: 'plain',
                    message: requestContext.user.shop.aboutDescription,
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showAbout(
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
                    requestContext.user.shop.aboutFileTid === null
                        ? undefined
                        : requestContext.user.shop.aboutFileTid,
                context: {
                    scenario: 'plain',
                    message: requestContext.user.shop.aboutDescription,
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
