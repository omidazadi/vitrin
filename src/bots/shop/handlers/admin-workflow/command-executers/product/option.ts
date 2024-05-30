import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { OptionRepository } from 'src/database/repositories/option-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { Option } from 'src/database/models/option';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';

@Injectable()
export class ShopAdminWorkflowProductOptionCommandExecuter {
    private frontend: HydratedFrontend;
    private optionRepository: OptionRepository;

    public constructor(
        frontend: HydratedFrontend,
        optionRepository: OptionRepository,
    ) {
        this.frontend = frontend;
        this.optionRepository = optionRepository;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'update') {
            await this.updateOption(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'show') {
            await this.showOption(
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
    public async updateOption(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 4) {
            await this.error(requestContext);
            return;
        }

        const option = await this.optionRepository.getOption(
            tokens[1],
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (option === null) {
            await this.error(requestContext);
            return;
        }

        option.fullName = tokens[2];
        option.fullButton = tokens[3];
        option.fileTid = requestContext.telegramContext.photo;
        await this.optionRepository.updateOption(
            option,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                photo: option.fileTid === null ? undefined : option.fileTid,
                context: {
                    scenario: 'plain',
                    message: await this.makeOptionInfo(requestContext, option),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showOption(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 2) {
            await this.error(requestContext);
            return;
        }

        const option = await this.optionRepository.getOption(
            tokens[1],
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (option === null) {
            await this.error(requestContext);
            return;
        }

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                photo: option.fileTid === null ? undefined : option.fileTid,
                context: {
                    scenario: 'plain',
                    message: await this.makeOptionInfo(requestContext, option),
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

    private async makeOptionInfo(
        requestContext: RequestContext<ShopCustomer>,
        option: Option,
    ): Promise<string> {
        return `Product:${option.product}\n\nName:${option.name}\n\nFull Name:${option.fullName}\n\nFull Button:${option.fullButton}`;
    }
}
