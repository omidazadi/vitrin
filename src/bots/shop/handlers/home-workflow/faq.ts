import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';

@Injectable()
export class ShopHomeWorkflowFaqHandler {
    private frontend: HydratedFrontend;

    public constructor(frontend: HydratedFrontend) {
        this.frontend = frontend;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<void> {
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'home-workflow/faq',
            {
                photo:
                    requestContext.user.shop.faqFileTid === null
                        ? undefined
                        : requestContext.user.shop.faqFileTid,
                context: {
                    description: requestContext.user.shop.faqDescription,
                },
            },
        );
    }
}
