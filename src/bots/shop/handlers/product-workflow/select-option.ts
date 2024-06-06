import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { instanceToInstance } from 'class-transformer';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { VarietyRepository } from 'src/database/repositories/variety-repository';
import { ShopProductWorkflowProductCameraHelper } from './helpers/product-camera';
import { ShopProductWorkflowSectionChainBuilderHelper } from './helpers/section-chain-builder';
import { ShopProductWorkflowRendererHelper } from './helpers/renderer';
import { OptionRepository } from 'src/database/repositories/option-repository';
import { ShopProductWorkflowProductUnavailableFallbackHelper } from './helpers/product-unavailable-fallback';

@Injectable()
export class ShopProductWorkflowSelectOptionHandler {
    private customerRepository: CustomerRepository;
    private varietyRepository: VarietyRepository;
    private optionRepository: OptionRepository;
    private productCameraHelper: ShopProductWorkflowProductCameraHelper;
    private productUnavailableFallbackHelper: ShopProductWorkflowProductUnavailableFallbackHelper;
    private sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper;
    private rendererHelper: ShopProductWorkflowRendererHelper;
    buttonTexts: any;

    public constructor(
        customerRepository: CustomerRepository,
        varietyRepository: VarietyRepository,
        optionRepository: OptionRepository,
        productCameraHelper: ShopProductWorkflowProductCameraHelper,
        productUnavailableFallbackHelper: ShopProductWorkflowProductUnavailableFallbackHelper,
        sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper,
        rendererHelper: ShopProductWorkflowRendererHelper,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.customerRepository = customerRepository;
        this.varietyRepository = varietyRepository;
        this.optionRepository = optionRepository;
        this.productCameraHelper = productCameraHelper;
        this.productUnavailableFallbackHelper =
            productUnavailableFallbackHelper;
        this.sectionChainBuilderHelper = sectionChainBuilderHelper;
        this.rendererHelper = rendererHelper;
        this.buttonTexts = buttonTexts;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<void> {
        const shopCustomer = instanceToInstance(requestContext.user);
        const extraContext: any = {};
        const position = shopCustomer.customer.data.currentOptions
            .map((optionValueDry: any) => optionValueDry.option)
            .indexOf(shopCustomer.customer.data.selectedOption);
        if (
            requestContext.telegramContext.text ===
            this.buttonTexts.state.option.erase
        ) {
            extraContext.erase = 'y';
            if (position !== -1) {
                shopCustomer.customer.data.currentOptions.splice(position, 1);
            }
        } else if (
            requestContext.telegramContext.text ===
            this.buttonTexts.state.option.back
        ) {
            extraContext.back = 'y';
        } else {
            if (position !== -1) {
                shopCustomer.customer.data.currentOptions[position] = {
                    option: shopCustomer.customer.data.selectedOption,
                    value: requestContext.telegramContext.text,
                };
            } else {
                shopCustomer.customer.data.currentOptions.push({
                    option: shopCustomer.customer.data.selectedOption,
                    value: requestContext.telegramContext.text,
                });
            }
        }
        delete shopCustomer.customer.data.selectedOption;

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

        extraContext.o = {
            option: await this.optionRepository.getOption(
                requestContext.user.customer.data.selectedOption,
                requestContext.user.customer.data.currentProduct,
                requestContext.user.shop.name,
                requestContext.poolClient,
            ),
            value: requestContext.telegramContext.text,
        };
        const availableProductVarieties =
            await this.varietyRepository.getAvailableProductVarieties(
                shopCustomer.customer.data.currentProduct,
                shopCustomer.customer.data.currentOptions,
                shopCustomer.shop.name,
                requestContext.poolClient,
            );
        if (availableProductVarieties.length === 0) {
            shopCustomer.customer.data = {
                state: 'product',
                section: shopCustomer.customer.data.section,
                currentProduct: shopCustomer.customer.data.currentProduct,
                currentOptions: [],
            };
            await this.customerRepository.updateCustomer(
                shopCustomer.customer,
                requestContext.poolClient,
            );
            await this.rendererHelper.render(
                requestContext,
                shopCustomer,
                'product-workflow/select-option',
                'product:land:invalid-option',
                { products: products, extraContext: extraContext },
            );
            return;
        }

        shopCustomer.customer.data.state = 'product';
        await this.customerRepository.updateCustomer(
            shopCustomer.customer,
            requestContext.poolClient,
        );
        await this.rendererHelper.render(
            requestContext,
            shopCustomer,
            'product-workflow/select-option',
            'product:land:option-selected',
            { products: products, extraContext: extraContext },
        );
    }
}
