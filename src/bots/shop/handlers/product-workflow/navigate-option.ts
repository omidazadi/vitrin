import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { instanceToInstance } from 'class-transformer';
import { OptionRepository } from 'src/database/repositories/option-repository';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { VarietyRepository } from 'src/database/repositories/variety-repository';
import { OptionVarietyRepository } from 'src/database/repositories/option-variety-repository';
import { OptionVariety } from 'src/database/models/option-variety';
import { ShopProductWorkflowProductCameraHelper } from './helpers/product-camera';
import { ShopProductWorkflowSectionChainBuilderHelper } from './helpers/section-chain-builder';
import { ShopProductWorkflowProductUnavailableFallbackHelper } from './helpers/product-unavailable-fallback';
import { CartItemRepository } from 'src/database/repositories/cart-item-repository';

@Injectable()
export class ShopProductWorkflowNavigateOptionHandler {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private optionRepository: OptionRepository;
    private varietyRepository: VarietyRepository;
    private optionVarietyRepository: OptionVarietyRepository;
    private cartItemRepository: CartItemRepository;
    private productCameraHelper: ShopProductWorkflowProductCameraHelper;
    private productUnavailableFallbackHelper: ShopProductWorkflowProductUnavailableFallbackHelper;
    private sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        optionRepository: OptionRepository,
        varietyRepository: VarietyRepository,
        optionVarietyRepository: OptionVarietyRepository,
        cartItemRepository: CartItemRepository,
        productCameraHelper: ShopProductWorkflowProductCameraHelper,
        productUnavailableFallbackHelper: ShopProductWorkflowProductUnavailableFallbackHelper,
        sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
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
        const selectedOption = options.find((option, index, options) =>
            option.fullButton === requestContext.telegramContext.text
                ? true
                : false,
        );
        if (typeof selectedOption === 'undefined') {
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

        let optionsMinusCurrent = instanceToInstance(
            shopCustomer.customer.data.currentOptions,
        );
        const position = optionsMinusCurrent
            .map((optionValueDry: any) => optionValueDry.option)
            .indexOf(selectedOption.name);
        if (position !== -1) {
            optionsMinusCurrent.splice(position, 1);
        }
        const availableProductVarieties =
            await this.varietyRepository.getAvailableProductVarieties(
                shopCustomer.customer.data.currentProduct,
                optionsMinusCurrent,
                shopCustomer.shop.name,
                requestContext.poolClient,
            );
        let availableValues: Array<string> = [];
        for (const variety of availableProductVarieties) {
            const optionVariety =
                (await this.optionVarietyRepository.getOptionVariety(
                    selectedOption.name,
                    variety.name,
                    variety.product,
                    variety.shop,
                    requestContext.poolClient,
                )) as OptionVariety;
            availableValues.push(optionVariety.value);
        }
        availableValues = availableValues.filter(
            (item, index) => availableValues.indexOf(item) === index,
        );

        shopCustomer.customer.data.state = 'option';
        shopCustomer.customer.data.selectedOption = selectedOption.name;
        await this.customerRepository.updateCustomer(
            shopCustomer.customer,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'product-workflow/navigate-option',
            {
                photo:
                    selectedOption.fileTid === null
                        ? undefined
                        : selectedOption.fileTid,
                context: {
                    scenario: 'option:land',
                    values: this.styleValues(availableValues),
                    selectedOption: selectedOption.fullName,
                },
            },
        );
    }

    private styleValues(values: Array<string>): Array<Array<string>> {
        const result: Array<Array<string>> = [];
        if (values.length % 5 === 4) {
            result.push([values.pop()!]);
            result.push([values.pop()!, values.pop()!, values.pop()!]);
        } else if (values.length % 5 === 3) {
            result.push([values.pop()!, values.pop()!, values.pop()!]);
        } else if (values.length % 5 === 2) {
            result.push([values.pop()!, values.pop()!]);
        } else if (values.length % 5 === 1) {
            result.push([values.pop()!]);
        }

        while (values.length > 0) {
            result.push([values.pop()!, values.pop()!]);
            result.push([values.pop()!, values.pop()!, values.pop()!]);
        }

        return result;
    }
}
