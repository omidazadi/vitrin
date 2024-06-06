import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { ProductRepository } from 'src/database/repositories/product-repository';
import { instanceToInstance } from 'class-transformer';
import { ShopProductWorkflowProductCameraHelper } from './helpers/product-camera';
import { ShopProductWorkflowProductUnavailableFallbackHelper } from './helpers/product-unavailable-fallback';
import { ShopProductWorkflowSectionChainBuilderHelper } from './helpers/section-chain-builder';

@Injectable()
export class ShopProductWorkflowMorePicturesHandler {
    private frontend: HydratedFrontend;
    private productRepository: ProductRepository;
    private productCameraHelper: ShopProductWorkflowProductCameraHelper;
    private productUnavailableFallbackHelper: ShopProductWorkflowProductUnavailableFallbackHelper;
    private sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper;

    public constructor(
        frontend: HydratedFrontend,
        productRepository: ProductRepository,
        productCameraHelper: ShopProductWorkflowProductCameraHelper,
        productUnavailableFallbackHelper: ShopProductWorkflowProductUnavailableFallbackHelper,
        sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper,
    ) {
        this.frontend = frontend;
        this.productRepository = productRepository;
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

        const media =
            await this.productRepository.getAvailableProductVarietyMedia(
                shopCustomer.customer.data.currentProduct,
                shopCustomer.customer.data.currentOptions,
                false,
                shopCustomer.shop.name,
                requestContext.poolClient,
            );

        await this.frontend.sendActionMessage(
            shopCustomer.customer.tid,
            'product-workflow/more-pictures',
            {
                album: media,
                context: {
                    scenario: media.length === 0 ? 'no-pictures' : 'success',
                },
            },
        );
    }
}
