import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VarietyMedia } from 'src/database/models/variety-media';
import { VarietyMediaRepository } from 'src/database/repositories/variety-media-repository';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';

@Injectable()
export class ShopAdminWorkflowProductVarietyMediaCommandExecuter {
    private frontend: HydratedFrontend;
    private varietyMediaRepository: VarietyMediaRepository;

    public constructor(
        frontend: HydratedFrontend,
        varietyMediaRepository: VarietyMediaRepository,
    ) {
        this.frontend = frontend;
        this.varietyMediaRepository = varietyMediaRepository;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'create') {
            await this.createMedia(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'show') {
            if (tokens.length >= 2 && tokens[1] === 'all') {
                await this.showAllMedia(
                    requestContext,
                    tokens.slice(2, tokens.length),
                );
            } else {
                await this.showMedia(
                    requestContext,
                    tokens.slice(1, tokens.length),
                );
            }
        } else if (tokens[0] === 'delete') {
            await this.deleteMedia(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else {
            await this.error(requestContext);
        }
    }

    @allowedMedia({
        photo: 'required',
        video: 'prohibited',
    })
    public async createMedia(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 4) {
            await this.error(requestContext);
            return;
        }

        if (tokens[3] !== 'true' && tokens[3] !== 'false') {
            await this.error(requestContext);
            return;
        }

        const media = await this.varietyMediaRepository.createVarietyMedia(
            tokens[2],
            tokens[1],
            tokens[0],
            requestContext.telegramContext.photo!,
            tokens[3] === 'true' ? true : false,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                photo: media.fileTid,
                context: {
                    scenario: 'plain',
                    message: await this.makeMediaInfo(requestContext, media),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showMedia(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 3) {
            await this.error(requestContext);
            return;
        }

        const media = await this.varietyMediaRepository.getVarietyMedia(
            tokens[2],
            tokens[1],
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (media === null) {
            await this.error(requestContext);
            return;
        }

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                photo: media.fileTid,
                context: {
                    scenario: 'plain',
                    message: await this.makeMediaInfo(requestContext, media),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showAllMedia(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 2) {
            await this.error(requestContext);
            return;
        }

        const media = await this.varietyMediaRepository.getAllVarietyMedia(
            tokens[1],
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: media.map((media) => media.name).join(','),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async deleteMedia(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 3) {
            await this.error(requestContext);
            return;
        }

        const media = await this.varietyMediaRepository.getVarietyMedia(
            tokens[2],
            tokens[1],
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (media === null) {
            await this.error(requestContext);
            return;
        }

        await this.varietyMediaRepository.deleteVarietyMedia(
            media.name,
            media.variety,
            media.product,
            media.shop,
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

    private async makeMediaInfo(
        requestContext: RequestContext<ShopCustomer>,
        media: VarietyMedia,
    ): Promise<string> {
        return `Product:${media.product}\n\nVariety:${media.variety}\n\nName:${media.name}\n\nIs Main:${media.isMain}`;
    }
}
