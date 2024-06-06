import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { ShopCustomer } from '../../user-builder';

@Injectable()
export class ShopInternalErrorHandler {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
    }

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
            'common/internal-error',
        );
    }
}
