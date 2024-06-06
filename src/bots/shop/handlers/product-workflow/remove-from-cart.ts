import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { instanceToInstance } from 'class-transformer';
import { OptionRepository } from 'src/database/repositories/option-repository';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { ShopProductWorkflowProductCameraHelper } from './helpers/product-camera';
import { ShopProductWorkflowSectionChainBuilderHelper } from './helpers/section-chain-builder';
import { ShopProductWorkflowProductUnavailableFallbackHelper } from './helpers/product-unavailable-fallback';
import { CartItemRepository } from 'src/database/repositories/cart-item-repository';

@Injectable()
export class ShopProductWorkflowRemoveFromCartHandler {
    private frontend: HydratedFrontend;
    private optionRepository: OptionRepository;
    private cartItemRepository: CartItemRepository;
    private productCameraHelper: ShopProductWorkflowProductCameraHelper;
    private productUnavailableFallbackHelper: ShopProductWorkflowProductUnavailableFallbackHelper;
    private sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper;

    public constructor(
        frontend: HydratedFrontend,
        optionRepository: OptionRepository,
        cartItemRepository: CartItemRepository,
        productCameraHelper: ShopProductWorkflowProductCameraHelper,
        productUnavailableFallbackHelper: ShopProductWorkflowProductUnavailableFallbackHelper,
        sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper,
    ) {
        this.frontend = frontend;
        this.optionRepository = optionRepository;
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
        const productCart = await this.cartItemRepository.getProductCart(
            shopCustomer.customer.id,
            product.name,
            product.shop,
            requestContext.poolClient,
        );
        if (productCart.length === 0) {
            await this.frontend.sendActionMessage(
                shopCustomer.customer.tid,
                'product-workflow/navigate-option',
                {
                    context: {
                        scenario: 'product:stay:unknown',
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
        await this.cartItemRepository.deleteProductCart(
            shopCustomer.customer.id,
            product.name,
            product.shop,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'product-workflow/delete-from-cart',
            {
                context: {
                    scenario: 'product:stay:deleted-from-cart',
                    product: product,
                    alreadyHave: false,
                    removedNumber: productCart.length,
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
    }
}
