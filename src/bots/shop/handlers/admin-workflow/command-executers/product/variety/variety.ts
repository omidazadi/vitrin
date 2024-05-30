import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VarietyRepository } from 'src/database/repositories/variety-repository';
import { Variety } from 'src/database/models/variety';
import { OptionVarietyRepository } from 'src/database/repositories/option-variety-repository';
import { OptionRepository } from 'src/database/repositories/option-repository';
import { ShopAdminWorkflowProductVarietyMediaCommandExecuter } from './media';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';

@Injectable()
export class ShopAdminWorkflowProductVarietyCommandExecuter {
    private frontend: HydratedFrontend;
    private mediaCommandExecuter: ShopAdminWorkflowProductVarietyMediaCommandExecuter;
    private varietyRepository: VarietyRepository;
    private optionVarietyRepository: OptionVarietyRepository;
    private optionRepository: OptionRepository;

    public constructor(
        frontend: HydratedFrontend,
        mediaCommandExecuter: ShopAdminWorkflowProductVarietyMediaCommandExecuter,
        varietyRepository: VarietyRepository,
        optionVarietyRepository: OptionVarietyRepository,
        optionRepository: OptionRepository,
    ) {
        this.frontend = frontend;
        this.mediaCommandExecuter = mediaCommandExecuter;
        this.varietyRepository = varietyRepository;
        this.optionVarietyRepository = optionVarietyRepository;
        this.optionRepository = optionRepository;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'media') {
            await this.mediaCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'create') {
            await this.createVariety(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'update') {
            await this.updateVariety(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'show') {
            if (tokens.length >= 2 && tokens[1] === 'all') {
                await this.showAllVarieties(
                    requestContext,
                    tokens.slice(2, tokens.length),
                );
            } else {
                await this.showVariety(
                    requestContext,
                    tokens.slice(1, tokens.length),
                );
            }
        } else if (tokens[0] === 'delete') {
            await this.deleteVariety(
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
    public async createVariety(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (
            tokens.length !== 2 &&
            tokens.length !== 4 &&
            tokens.length !== 6 &&
            tokens.length !== 8
        ) {
            await this.error(requestContext);
            return;
        }

        const variety = await this.varietyRepository.createVariety(
            tokens[1],
            tokens[0],
            0,
            0,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );

        const options = await this.optionRepository.getProductOptions(
            tokens[0],
            variety.shop,
            requestContext.poolClient,
        );
        if (options.length !== (tokens.length - 2) / 2) {
            await this.error(requestContext);
            return;
        }

        let tokenCurser = 2;
        while (tokenCurser < tokens.length) {
            let flag = false;
            for (const option of options) {
                if (option.name === tokens[tokenCurser]) {
                    flag = true;
                }
            }
            if (!flag) {
                await this.error(requestContext);
                return;
            }

            await this.optionVarietyRepository.createOptionVariety(
                tokens[tokenCurser + 1],
                tokens[tokenCurser],
                tokens[1],
                tokens[0],
                variety.shop,
                requestContext.poolClient,
            );
            tokenCurser += 2;
        }

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: await this.makeVarietyInfo(
                        requestContext,
                        variety,
                    ),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async updateVariety(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 4) {
            await this.error(requestContext);
            return;
        }

        const variety = await this.varietyRepository.getVariety(
            tokens[1],
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (variety === null) {
            await this.error(requestContext);
            return;
        }

        variety.price = parseInt(tokens[2]);
        variety.stock = parseInt(tokens[3]);
        await this.varietyRepository.updateVariety(
            variety,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: await this.makeVarietyInfo(
                        requestContext,
                        variety,
                    ),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showVariety(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 2) {
            await this.error(requestContext);
            return;
        }

        const variety = await this.varietyRepository.getVariety(
            tokens[1],
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (variety === null) {
            await this.error(requestContext);
            return;
        }

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: await this.makeVarietyInfo(
                        requestContext,
                        variety,
                    ),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showAllVarieties(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        const varieties = await this.varietyRepository.getAllVarieties(
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
                    message: varieties.map((variety) => variety.name).join(','),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async deleteVariety(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 2) {
            await this.error(requestContext);
            return;
        }

        const variety = await this.varietyRepository.getVariety(
            tokens[1],
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (variety === null) {
            await this.error(requestContext);
            return;
        }

        await this.varietyRepository.deleteVariety(
            variety.name,
            variety.product,
            variety.shop,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'done',
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

    private async makeVarietyInfo(
        requestContext: RequestContext<ShopCustomer>,
        variety: Variety,
    ): Promise<string> {
        return `Product:${variety.product}\n\nName:${variety.name}\n\nPrice:${variety.price}\n\nStock:${variety.stock}`;
    }
}
