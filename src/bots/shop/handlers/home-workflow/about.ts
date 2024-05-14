import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { Customer } from 'src/database/models/customer';
import { ShopRepository } from 'src/database/repositories/shop-repository';

@Injectable()
export class ShopHomeWorkflowAboutHandler {
    private frontend: HydratedFrontend;
    private shopRepository: ShopRepository;

    public constructor(
        frontend: HydratedFrontend,
        shopRepository: ShopRepository,
    ) {
        this.frontend = frontend;
        this.shopRepository = shopRepository;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<Customer>,
    ): Promise<void> {
        const about = (
            await this.shopRepository.getShopForce(
                requestContext.user.shop,
                requestContext.poolClient,
            )
        ).aboutDescription;
        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'home-workflow/about',
            { context: { description: about } },
        );
    }
}
