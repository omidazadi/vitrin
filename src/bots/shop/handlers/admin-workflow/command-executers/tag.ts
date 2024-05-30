import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { TagRepository } from 'src/database/repositories/tag-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';

@Injectable()
export class ShopAdminWorkflowTagCommandExecuter {
    private frontend: HydratedFrontend;
    private tagRepository: TagRepository;

    public constructor(
        frontend: HydratedFrontend,
        tagRepository: TagRepository,
    ) {
        this.frontend = frontend;
        this.tagRepository = tagRepository;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'create') {
            await this.createTag(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'delete') {
            await this.deleteTag(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (
            tokens.length >= 2 &&
            tokens[0] === 'show' &&
            tokens[1] === 'all'
        ) {
            await this.showAllTags(
                requestContext,
                tokens.slice(2, tokens.length),
            );
        } else {
            await this.error(requestContext);
        }
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async createTag(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        await this.tagRepository.createTag(
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
    public async deleteTag(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        await this.tagRepository.deleteTag(
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
    public async showAllTags(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 0) {
            await this.error(requestContext);
            return;
        }

        const tags = await this.tagRepository.getAllTags(
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: tags.map((tag) => tag.name).join(','),
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
