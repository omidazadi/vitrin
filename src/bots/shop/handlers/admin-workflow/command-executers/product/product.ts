import { Injectable } from '@nestjs/common';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { ShopAdminWorkflowProductTagCommandExecuter } from './tag';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { ProductRepository } from 'src/database/repositories/product-repository';
import { Product } from 'src/database/models/product';
import { OptionRepository } from 'src/database/repositories/option-repository';
import { VarietyRepository } from 'src/database/repositories/variety-repository';
import { ShopAdminWorkflowProductOptionCommandExecuter } from './option';
import { ShopAdminWorkflowProductVarietyCommandExecuter } from './variety/variety';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';

@Injectable()
export class ShopAdminWorkflowProductCommandExecuter {
    private frontend: HydratedFrontend;
    private tagCommandExecuter: ShopAdminWorkflowProductTagCommandExecuter;
    private optionCommandExecuter: ShopAdminWorkflowProductOptionCommandExecuter;
    private varietyCommandExecuter: ShopAdminWorkflowProductVarietyCommandExecuter;
    private productRepository: ProductRepository;
    private optionRepository: OptionRepository;
    private varietyRepository: VarietyRepository;

    public constructor(
        frontend: HydratedFrontend,
        tagCommandExecuter: ShopAdminWorkflowProductTagCommandExecuter,
        optionCommandExecuter: ShopAdminWorkflowProductOptionCommandExecuter,
        varietyCommandExecuter: ShopAdminWorkflowProductVarietyCommandExecuter,
        productRepository: ProductRepository,
        optionRepository: OptionRepository,
        varietyRepository: VarietyRepository,
    ) {
        this.frontend = frontend;
        this.tagCommandExecuter = tagCommandExecuter;
        this.optionCommandExecuter = optionCommandExecuter;
        this.varietyCommandExecuter = varietyCommandExecuter;
        this.productRepository = productRepository;
        this.optionRepository = optionRepository;
        this.varietyRepository = varietyRepository;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'tag') {
            await this.tagCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'option') {
            await this.optionCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'variety') {
            await this.varietyCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'create') {
            await this.createProduct(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'update') {
            await this.updateProduct(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'show') {
            if (tokens.length >= 2 && tokens[1] === 'all') {
                await this.showAllProducts(
                    requestContext,
                    tokens.slice(2, tokens.length),
                );
            } else {
                await this.showProduct(
                    requestContext,
                    tokens.slice(1, tokens.length),
                );
            }
        } else if (tokens[0] === 'delete') {
            await this.deleteProduct(
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
    public async createProduct(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (
            tokens.length !== 1 &&
            tokens.length !== 2 &&
            tokens.length !== 3 &&
            tokens.length !== 4
        ) {
            await this.error(requestContext);
            return;
        }

        let product = await this.productRepository.createProduct(
            tokens[0],
            tokens[0],
            tokens[0],
            new Date(),
            requestContext.user.shop.name,
            requestContext.poolClient,
        );

        let tokenCurser = 1;
        while (tokenCurser < tokens.length) {
            await this.optionRepository.createOption(
                tokens[tokenCurser],
                tokens[tokenCurser],
                tokens[tokenCurser],
                null,
                product.name,
                product.shop,
                requestContext.poolClient,
            );
            tokenCurser += 1;
        }

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: await this.makeProductInfo(
                        requestContext,
                        product,
                    ),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async updateProduct(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 3) {
            await this.error(requestContext);
            return;
        }

        const product = await this.productRepository.getProduct(
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (product === null) {
            await this.error(requestContext);
            return;
        }

        product.fullName = tokens[1];
        product.description = tokens[2];
        await this.productRepository.updateProduct(
            product,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: await this.makeProductInfo(
                        requestContext,
                        product,
                    ),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showProduct(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        const product = await this.productRepository.getProduct(
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (product === null) {
            await this.error(requestContext);
            return;
        }

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: await this.makeProductInfo(
                        requestContext,
                        product,
                    ),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showAllProducts(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 0) {
            await this.error(requestContext);
            return;
        }

        const allProducts = await this.productRepository.getAllProducts(
            requestContext.user.shop.name,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: allProducts
                        .map((product) => product.name)
                        .join(','),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async deleteProduct(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        const product = await this.productRepository.getProduct(
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (product === null) {
            await this.error(requestContext);
            return;
        }

        await this.productRepository.deleteProduct(
            product.name,
            product.shop,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: { scenario: 'done' },
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

    private async makeProductInfo(
        requestContext: RequestContext<ShopCustomer>,
        product: Product,
    ): Promise<string> {
        const tags = await this.productRepository.getProductTags(
            product.name,
            product.shop,
            requestContext.poolClient,
        );
        const options = await this.optionRepository.getProductOptions(
            product.name,
            product.shop,
            requestContext.poolClient,
        );
        const varieties = await this.varietyRepository.getProductVarieties(
            product.name,
            product.shop,
            requestContext.poolClient,
        );
        return `Name:${product.name}\n\nFull Name:${product.fullName}\n\nDescription:${product.description}\n\nOptions:${options.map((option) => option.name).join(',')}\n\nVarieties:${varieties.map((variety) => variety.name).join(',')}\n\nTags:${tags.map((tag) => tag.name).join(',')}`;
    }
}
