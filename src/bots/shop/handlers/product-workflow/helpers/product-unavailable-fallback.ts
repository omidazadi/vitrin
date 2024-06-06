import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { Product } from 'src/database/models/product';
import { Section } from 'src/database/models/section';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopProductWorkflowRendererHelper } from './renderer';
import { setTimeout } from 'timers/promises';
import { uxConstant } from 'src/infrastructures/constants/ux-constant';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';

@Injectable()
export class ShopProductWorkflowProductUnavailableFallbackHelper {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private rendererHelper: ShopProductWorkflowRendererHelper;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        rendererHelper: ShopProductWorkflowRendererHelper,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.rendererHelper = rendererHelper;
    }

    public async productUnavailableFallback(
        requestContext: RequestContext<ShopCustomer>,
        shopCustomer: ShopCustomer,
        action: string,
        sectionChain: Array<Section>,
        products: Array<Product>,
    ): Promise<boolean> {
        if (products.length === 0) {
            let scenario: ShopProductWorkflowRendererHelper.Scenario;
            if (sectionChain.length > 1) {
                sectionChain.pop();
                const section = sectionChain[sectionChain.length - 1];
                shopCustomer.customer.data = {
                    state: 'section',
                    section: section.name,
                };
                scenario = 'section:no-product:out-of-stock';
            } else {
                shopCustomer.customer.data = { state: 'home' };
                scenario = 'home:no-product-nor-section:out-of-stock';
            }
            await this.customerRepository.updateCustomer(
                shopCustomer.customer,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                shopCustomer.customer.tid,
                action,
                { context: { scenario: 'helper:out-of-stock' } },
            );
            await setTimeout(uxConstant.consecutiveMessageDelay);
            await this.rendererHelper.render(
                requestContext,
                shopCustomer,
                action,
                scenario,
                { products: products },
            );
            return true;
        }

        if (
            !products
                .map((product) => product.name)
                .includes(shopCustomer.customer.data.currentProduct)
        ) {
            shopCustomer.customer.data = {
                state: 'product',
                section: shopCustomer.customer.data.section,
                currentProduct: products[0].name,
                currentOptions: [],
            };
            await this.customerRepository.updateCustomer(
                shopCustomer.customer,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                shopCustomer.customer.tid,
                action,
                { context: { scenario: 'helper:out-of-stock' } },
            );
            await setTimeout(uxConstant.consecutiveMessageDelay);
            await this.rendererHelper.render(
                requestContext,
                shopCustomer,
                action,
                'product:land:out-of-stock',
                { products: products },
            );
            return true;
        }

        return false;
    }
}
