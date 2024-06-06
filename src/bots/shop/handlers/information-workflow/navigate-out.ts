import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { ShopCustomer } from '../../user-builder';

@Injectable()
export class ShopInformationWorkflowNavigateOutHandler {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<void> {
        const customer = instanceToInstance(requestContext.user.customer);
        customer.data = { state: 'home' };
        await this.customerRepository.updateCustomer(
            customer,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'information-workflow/navigate-out',
            {
                photo:
                    requestContext.user.shop.mainFileTid === null
                        ? undefined
                        : requestContext.user.shop.mainFileTid,
                context: {
                    description: requestContext.user.shop.mainDescription,
                },
            },
        );
    }
}
