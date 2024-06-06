import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { SectionRepository } from 'src/database/repositories/section-repository';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { ProductRepository } from 'src/database/repositories/product-repository';
import { Product } from 'src/database/models/product';
import { OptionRepository } from 'src/database/repositories/option-repository';
import { ShopProductWorkflowProductCameraHelper } from './product-camera';
import { ShopProductWorkflowSectionChainBuilderHelper } from './section-chain-builder';
import { CartItemRepository } from 'src/database/repositories/cart-item-repository';

@Injectable()
export class ShopProductWorkflowRendererHelper {
    private frontend: HydratedFrontend;
    private sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper;
    private productCameraHelper: ShopProductWorkflowProductCameraHelper;
    private productRepository: ProductRepository;
    private sectionRepository: SectionRepository;
    private optionRepository: OptionRepository;
    private cartItemRepository: CartItemRepository;

    public constructor(
        frontend: HydratedFrontend,
        sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper,
        productCameraHelper: ShopProductWorkflowProductCameraHelper,
        productRepository: ProductRepository,
        sectionRepository: SectionRepository,
        optionRepository: OptionRepository,
        cartItemRepository: CartItemRepository,
    ) {
        this.frontend = frontend;
        this.sectionChainBuilderHelper = sectionChainBuilderHelper;
        this.productCameraHelper = productCameraHelper;
        this.productRepository = productRepository;
        this.sectionRepository = sectionRepository;
        this.optionRepository = optionRepository;
        this.cartItemRepository = cartItemRepository;
    }

    public async render(
        requestContext: RequestContext<ShopCustomer>,
        shopCustomer: ShopCustomer,
        action: string,
        scenario: ShopProductWorkflowRendererHelper.Scenario,
        fetched?: { products?: Array<Product>; extraContext?: any },
    ): Promise<void> {
        const extraContext =
            typeof fetched?.extraContext === 'undefined'
                ? {}
                : fetched.extraContext;
        if (
            scenario === 'home:no-product-nor-section' ||
            scenario === 'home:no-product-nor-section:out-of-stock'
        ) {
            await this.frontend.sendActionMessage(
                shopCustomer.customer.tid,
                action,
                {
                    context: {
                        scenario: scenario,
                        description: shopCustomer.shop.mainDescription,
                        ...extraContext,
                    },
                },
            );
        } else if (
            scenario === 'section:land' ||
            scenario === 'section:no-product' ||
            scenario === 'section:no-product:out-of-stock'
        ) {
            const section = await this.sectionRepository.getSection(
                shopCustomer.customer.data.section,
                shopCustomer.shop.name,
                requestContext.poolClient,
            );
            if (section === null) {
                throw new Error('Inconsistent section chain detected.');
            }
            const childSections = await this.sectionRepository.getChildSections(
                section.name,
                shopCustomer.shop.name,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                shopCustomer.customer.tid,
                action,
                {
                    photo:
                        section.fileTid !== null && scenario === 'section:land'
                            ? section.fileTid
                            : undefined,
                    context: {
                        scenario: scenario,
                        section: section,
                        childSections: childSections,
                        ...extraContext,
                    },
                },
            );
        } else if (
            scenario === 'product:land' ||
            scenario === 'product:land:out-of-stock' ||
            scenario === 'product:land:invalid-option' ||
            scenario === 'product:land:option-selected'
        ) {
            let products: Array<Product>;
            if (typeof fetched?.products !== 'undefined') {
                products = fetched.products;
            } else {
                const sectionChain =
                    await this.sectionChainBuilderHelper.buildSectionChain(
                        requestContext,
                        shopCustomer.customer.data.section,
                    );
                products = await this.productCameraHelper.snapshotProducts(
                    requestContext,
                    sectionChain,
                );
            }

            const product = (await this.productRepository.getProduct(
                shopCustomer.customer.data.currentProduct,
                shopCustomer.shop.name,
                requestContext.poolClient,
            )) as Product;
            const options = await this.optionRepository.getProductOptions(
                product.name,
                shopCustomer.shop.name,
                requestContext.poolClient,
            );
            const media =
                await this.productRepository.getAvailableProductVarietyMedia(
                    product.name,
                    shopCustomer.customer.data.currentOptions,
                    true,
                    shopCustomer.shop.name,
                    requestContext.poolClient,
                );
            const price = await this.productRepository.getAvailableProductPrice(
                product.name,
                shopCustomer.customer.data.currentOptions,
                shopCustomer.shop.name,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                shopCustomer.customer.tid,
                action,
                {
                    album: media,
                    context: {
                        scenario: scenario,
                        product: product,
                        alreadyHave:
                            await this.cartItemRepository.doesHaveInCart(
                                shopCustomer.customer.id,
                                product.name,
                                shopCustomer.shop.name,
                                requestContext.poolClient,
                            ),
                        currentNumber:
                            products
                                .map((product) => product.name)
                                .indexOf(product.name) + 1,
                        totalNumber: products.length,
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
                        price: price,
                        ...extraContext,
                    },
                },
            );
        }
    }
}

export namespace ShopProductWorkflowRendererHelper {
    export type Scenario =
        | 'section:land'
        | 'product:land'
        | 'product:land:out-of-stock'
        | 'product:land:invalid-option'
        | 'product:land:option-selected'
        | 'section:no-product'
        | 'section:no-product:out-of-stock'
        | 'home:no-product-nor-section'
        | 'home:no-product-nor-section:out-of-stock';
}
