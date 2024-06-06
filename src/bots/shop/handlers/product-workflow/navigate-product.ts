import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { instanceToInstance } from 'class-transformer';
import { ShopProductWorkflowProductCameraHelper } from './helpers/product-camera';
import { ShopProductWorkflowSectionChainBuilderHelper } from './helpers/section-chain-builder';
import { ShopProductWorkflowRendererHelper } from './helpers/renderer';
import { CustomerRepository } from 'src/database/repositories/customer-repository';

@Injectable()
export class ShopProductWorkflowNavigateProductHandler {
    private customerRepository: CustomerRepository;
    private productCameraHelper: ShopProductWorkflowProductCameraHelper;
    private sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper;
    private rendererHelper: ShopProductWorkflowRendererHelper;
    private buttonTexts: any;

    public constructor(
        customerRepository: CustomerRepository,
        productCameraHelper: ShopProductWorkflowProductCameraHelper,
        sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper,
        rendererHelper: ShopProductWorkflowRendererHelper,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.customerRepository = customerRepository;
        this.productCameraHelper = productCameraHelper;
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
        let delta =
            requestContext.telegramContext.text ===
            this.buttonTexts.state.product.next
                ? 1
                : -1;
        const sectionChain =
            await this.sectionChainBuilderHelper.buildSectionChain(
                requestContext,
                requestContext.user.customer.data.section,
            );
        const products = await this.productCameraHelper.snapshotProducts(
            requestContext,
            sectionChain,
        );
        if (products.length === 0) {
            const shopCustomer = instanceToInstance(requestContext.user);
            let scenario: ShopProductWorkflowRendererHelper.Scenario;
            if (sectionChain.length > 1) {
                sectionChain.pop();
                const section = sectionChain[sectionChain.length - 1];
                shopCustomer.customer.data = {
                    state: 'section',
                    section: section.name,
                };
                scenario = 'section:no-product';
            } else {
                shopCustomer.customer.data = { state: 'home' };
                scenario = 'home:no-product-nor-section';
            }
            await this.customerRepository.updateCustomer(
                shopCustomer.customer,
                requestContext.poolClient,
            );
            await this.rendererHelper.render(
                requestContext,
                shopCustomer,
                'product-workflow/navigate-product',
                scenario,
                { products: products },
            );
            return;
        }

        let position = products
            .map((product) => product.name)
            .indexOf(requestContext.user.customer.data.currentProduct);
        if (position === -1) {
            position = 0;
        } else {
            position += delta;
            if (position < 0) {
                position = 0;
            } else if (position >= products.length) {
                position = products.length - 1;
            }
        }

        const shopCustomer = instanceToInstance(requestContext.user);
        shopCustomer.customer.data = {
            state: 'product',
            section: shopCustomer.customer.data.section,
            currentProduct: products[position].name,
            currentOptions: [],
        };
        await this.customerRepository.updateCustomer(
            shopCustomer.customer,
            requestContext.poolClient,
        );
        await this.rendererHelper.render(
            requestContext,
            shopCustomer,
            'product-workflow/navigate-product',
            'product:land',
            { products: products },
        );
    }
}
