import { Injectable } from '@nestjs/common';
import { Visitor } from 'src/database/models/visitor';
import { ShopRepository } from 'src/database/repositories/shop-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';

@Injectable()
export class VitrinAdminWorkflowShopSubcommandExecuter {
    private shopRepository: ShopRepository;

    public constructor(shopRepository: ShopRepository) {
        this.shopRepository = shopRepository;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async createShop(
        requestContext: RequestContext<Visitor>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 5) {
        }

        const shop = await this.shopRepository.createShop(
            tokens[0],
            tokens[1],
            tokens[2],
            tokens[3],
            false,
            1,
            null,
            null,
            null,
            null,
            null,
            null,
            parseInt(tokens[4]),
            requestContext.poolClient,
        );
    }
}
