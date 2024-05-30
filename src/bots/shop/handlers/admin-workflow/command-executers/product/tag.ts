import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { TagProductRepository } from 'src/database/repositories/tag-product-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';

@Injectable()
export class ShopAdminWorkflowProductTagCommandExecuter {
    private frontend: HydratedFrontend;
    private tagProductRepository: TagProductRepository;

    public constructor(
        frontend: HydratedFrontend,
        tagProductRepository: TagProductRepository,
    ) {
        this.frontend = frontend;
        this.tagProductRepository = tagProductRepository;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'add') {
            await this.addTag(requestContext, tokens.slice(1, tokens.length));
        } else if (tokens[0] === 'remove') {
            await this.removeTag(
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
    public async addTag(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 2) {
            await this.error(requestContext);
            return;
        }
        await this.tagProductRepository.createTagProduct(
            tokens[1],
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            { context: { scenario: 'done' } },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async removeTag(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 2) {
            await this.error(requestContext);
            return;
        }
        await this.tagProductRepository.deleteTagProduct(
            tokens[1],
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
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
