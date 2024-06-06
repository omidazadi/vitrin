import { Injectable } from '@nestjs/common';
import { Bot as GrammyBot } from 'grammy';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { instanceToInstance } from 'class-transformer';
import { OptionRepository } from 'src/database/repositories/option-repository';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VarietyRepository } from 'src/database/repositories/variety-repository';
import { ShopProductWorkflowProductCameraHelper } from './helpers/product-camera';
import { ShopProductWorkflowSectionChainBuilderHelper } from './helpers/section-chain-builder';
import { ShopProductWorkflowProductUnavailableFallbackHelper } from './helpers/product-unavailable-fallback';
import { CartItemRepository } from 'src/database/repositories/cart-item-repository';
import { setTimeout } from 'timers/promises';
import { uxConstant } from 'src/infrastructures/constants/ux-constant';
import { CartItem } from 'src/database/models/cart-item';
import { ProductRepository } from 'src/database/repositories/product-repository';
import { Product } from 'src/database/models/product';
import { shopConstant } from '../../constants/shop-constant';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';
import { OptionVarietyRepository } from 'src/database/repositories/option-variety-repository';
import { Option } from 'src/database/models/option';
import { Variety } from 'src/database/models/variety';

@Injectable()
export class ShopProductWorkflowAddToCartHandler {
    private grammyBot: GrammyBot;
    private frontend: HydratedFrontend;
    private productRepository: ProductRepository;
    private optionRepository: OptionRepository;
    private varietyRepository: VarietyRepository;
    private optionVarietyRepository: OptionVarietyRepository;
    private cartItemRepository: CartItemRepository;
    private productCameraHelper: ShopProductWorkflowProductCameraHelper;
    private productUnavailableFallbackHelper: ShopProductWorkflowProductUnavailableFallbackHelper;
    private sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper;

    public constructor(
        grammyBot: GrammyBot,
        frontend: HydratedFrontend,
        productRepository: ProductRepository,
        optionRepository: OptionRepository,
        varietyRepository: VarietyRepository,
        optionVarietyRepository: OptionVarietyRepository,
        cartItemRepository: CartItemRepository,
        productCameraHelper: ShopProductWorkflowProductCameraHelper,
        productUnavailableFallbackHelper: ShopProductWorkflowProductUnavailableFallbackHelper,
        sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper,
    ) {
        this.grammyBot = grammyBot;
        this.frontend = frontend;
        this.productRepository = productRepository;
        this.optionRepository = optionRepository;
        this.varietyRepository = varietyRepository;
        this.optionVarietyRepository = optionVarietyRepository;
        this.cartItemRepository = cartItemRepository;
        this.productCameraHelper = productCameraHelper;
        this.productUnavailableFallbackHelper =
            productUnavailableFallbackHelper;
        this.sectionChainBuilderHelper = sectionChainBuilderHelper;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<void> {
        const shopCustomer = instanceToInstance(requestContext.user);

        const sectionChain =
            await this.sectionChainBuilderHelper.buildSectionChain(
                requestContext,
                shopCustomer.customer.data.section,
            );
        const products = await this.productCameraHelper.snapshotProducts(
            requestContext,
            sectionChain,
        );
        if (
            await this.productUnavailableFallbackHelper.productUnavailableFallback(
                requestContext,
                shopCustomer,
                'product-workflow/navigate-option',
                sectionChain,
                products,
            )
        ) {
            return;
        }

        const product = products.find(
            (value, index, obj) =>
                value.name === shopCustomer.customer.data.currentProduct,
        )!;
        const options = await this.optionRepository.getProductOptions(
            shopCustomer.customer.data.currentProduct,
            shopCustomer.shop.name,
            requestContext.poolClient,
        );

        if (options.length > shopCustomer.customer.data.currentOptions.length) {
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'product-workflow/add-to-cart',
                {
                    forcedType: 'keyboard',
                    context: {
                        scenario: 'product:stay:all-options-are-required',
                        alreadyHave:
                            await this.cartItemRepository.doesHaveInCart(
                                shopCustomer.customer.id,
                                product.name,
                                shopCustomer.shop.name,
                                requestContext.poolClient,
                            ),
                        optionValues: options.map((option) => {
                            const position =
                                shopCustomer.customer.data.currentOptions
                                    .map(
                                        (optionValueDry: any) =>
                                            optionValueDry.option,
                                    )
                                    .indexOf(option.name);
                            return {
                                option: option,
                                value:
                                    position !== -1
                                        ? shopCustomer.customer.data
                                              .currentOptions[position].value
                                        : null,
                            };
                        }),
                    },
                },
            );
            return;
        }

        const availableProductVarieties =
            await this.varietyRepository.getAvailableProductVarieties(
                shopCustomer.customer.data.currentProduct,
                shopCustomer.customer.data.currentOptions,
                shopCustomer.shop.name,
                requestContext.poolClient,
            );
        const variety = availableProductVarieties[0]!;
        const cartItem = await this.cartItemRepository.createCartItem(
            shopCustomer.customer.id,
            variety.product,
            variety.name,
            new Date(),
            variety.shop,
            requestContext.poolClient,
        );

        const cart = await this.cartItemRepository.getCustomerCart(
            shopCustomer.customer.id,
            shopCustomer.shop.name,
            requestContext.poolClient,
        );
        if (cart.length > shopConstant.cartSize) {
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'product-workflow/add-to-cart',
                {
                    forcedType: 'keyboard',
                    context: {
                        scenario: 'product:stay:cart-is-full',
                        alreadyHave:
                            await this.cartItemRepository.doesHaveInCart(
                                shopCustomer.customer.id,
                                product.name,
                                shopCustomer.shop.name,
                                requestContext.poolClient,
                            ),
                        optionValues: options.map((option) => {
                            const position =
                                shopCustomer.customer.data.currentOptions
                                    .map(
                                        (optionValueDry: any) =>
                                            optionValueDry.option,
                                    )
                                    .indexOf(option.name);
                            return {
                                option: option,
                                value:
                                    position !== -1
                                        ? shopCustomer.customer.data
                                              .currentOptions[position].value
                                        : null,
                            };
                        }),
                    },
                },
            );
            throw new ExpectedError();
        }

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'product-workflow/add-to-cart',
            {
                forcedType: 'keyboard',
                context: {
                    scenario: 'product:stay:added-to-cart',
                    product: product,
                    alreadyHave: true,
                    optionValues: options.map((option) => {
                        const position =
                            shopCustomer.customer.data.currentOptions
                                .map(
                                    (optionValueDry: any) =>
                                        optionValueDry.option,
                                )
                                .indexOf(option.name);
                        return {
                            option: option,
                            value:
                                position !== -1
                                    ? shopCustomer.customer.data.currentOptions[
                                          position
                                      ].value
                                    : null,
                        };
                    }),
                },
            },
        );
        await setTimeout(uxConstant.consecutiveMessageDelay);
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'product-workflow/add-to-cart',
            {
                forcedType: 'url',
                context: {
                    scenario: 'checkout-notification',
                    cartSize: cart.length,
                    botUsername: this.grammyBot.botInfo.username,
                },
            },
        );
    }
}
