import { Injectable } from '@nestjs/common';
import { Customer } from 'src/database/models/customer';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';

@Injectable()
export class ShopUnknownErrorHandler {
    private frontend: HydratedFrontend;

    public constructor(frontend: HydratedFrontend) {
        this.frontend = frontend;
    }

    public async handle(
        requestContext: RequestContext<Customer>,
    ): Promise<void> {
        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'common/unknown-error',
        );
    }
}
