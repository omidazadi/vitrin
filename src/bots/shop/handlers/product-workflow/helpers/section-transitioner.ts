import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { Section } from 'src/database/models/section';
import { SectionRepository } from 'src/database/repositories/section-repository';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopProductWorkflowProductCameraHelper } from './product-camera';
import { ShopProductWorkflowRendererHelper } from './renderer';

@Injectable()
export class ShopProductWorkflowSectionTransitionerHelper {
    private sectionRepository: SectionRepository;
    private productCameraHelper: ShopProductWorkflowProductCameraHelper;

    public constructor(
        sectionRepository: SectionRepository,
        productCameraHelper: ShopProductWorkflowProductCameraHelper,
    ) {
        this.sectionRepository = sectionRepository;
        this.productCameraHelper = productCameraHelper;
    }

    public async transition(
        requestContext: RequestContext<ShopCustomer>,
        shopCustomer: ShopCustomer,
        sectionChain: Array<Section>,
    ): Promise<ShopProductWorkflowRendererHelper.Scenario> {
        const section = sectionChain[sectionChain.length - 1];
        const childSections = await this.sectionRepository.getChildSections(
            section.name,
            section.shop,
            requestContext.poolClient,
        );

        if (childSections.length === 0) {
            const products = await this.productCameraHelper.snapshotProducts(
                requestContext,
                sectionChain,
            );

            if (products.length === 0) {
                if (sectionChain.length > 1) {
                    sectionChain.pop();
                    const section = sectionChain[sectionChain.length - 1];
                    shopCustomer.customer.data = {
                        state: 'section',
                        section: section.name,
                    };
                    return 'section:no-product';
                } else {
                    shopCustomer.customer.data = { state: 'home' };
                    return 'home:no-product-nor-section';
                }
            }

            shopCustomer.customer.data = {
                state: 'product',
                section: section.name,
                currentProduct: products[0].name,
                currentOptions: [],
            };
            return 'product:land';
        } else {
            shopCustomer.customer.data = {
                state: 'section',
                section: section.name,
            };
            return 'section:land';
        }
    }
}
