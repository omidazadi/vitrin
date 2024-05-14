import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { Customer } from 'src/database/models/customer';
import { CustomerRepository } from 'src/database/repositories/customer-repository';

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
        requestContext: RequestContext<Customer>,
    ): Promise<void> {
        const customer = instanceToInstance(requestContext.user);
        customer.data = { state: 'home' };
        await this.customerRepository.updateCustomer(
            customer,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'common/internal-error',
        );
    }
}
