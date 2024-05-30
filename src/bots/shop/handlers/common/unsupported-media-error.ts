import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { ShopCustomer } from '../../user-builder';

@Injectable()
export class ShopUnsupportedMediaErrorHandler {
    private frontend: HydratedFrontend;

    public constructor(frontend: HydratedFrontend) {
        this.frontend = frontend;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<void> {
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'common/unsupported-media-error',
        );
    }
}
