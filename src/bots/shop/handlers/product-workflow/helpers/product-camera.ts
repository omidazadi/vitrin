import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { Product } from 'src/database/models/product';
import { Section } from 'src/database/models/section';
import { ProductRepository } from 'src/database/repositories/product-repository';
import { VarietyRepository } from 'src/database/repositories/variety-repository';
import { RequestContext } from 'src/infrastructures/context/request-context';

@Injectable()
export class ShopProductWorkflowProductCameraHelper {
    private productRepository: ProductRepository;
    private varietyRepository: VarietyRepository;

    public constructor(
        productRepository: ProductRepository,
        varietyRepository: VarietyRepository,
    ) {
        this.productRepository = productRepository;
        this.varietyRepository = varietyRepository;
    }

    public async snapshotProducts(
        requestContext: RequestContext<ShopCustomer>,
        sectionChain: Array<Section>,
    ): Promise<Array<Product>> {
        await this.varietyRepository.lockAllVarieties(
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        const products = await this.productRepository.getProductsBySections(
            sectionChain,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        return products;
    }
}
