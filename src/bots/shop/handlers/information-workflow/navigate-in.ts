import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { ShopCustomer } from '../../user-builder';

@Injectable()
export class ShopInformationWorkflowNavigateInHandler {
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
        if (
            customer.firstName !== null &&
            customer.lastName !== null &&
            customer.address !== null &&
            customer.zipCode !== null
        ) {
            customer.data = { state: 'information-document' };
            await this.customerRepository.updateCustomer(
                customer,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'information-workflow/navigate-in',
                { context: { scenario: 'document:land', customer: customer } },
            );
            return;
        } else {
            customer.data = {
                state: 'information-questionnaire',
                entry: 'firstName',
            };
            await this.customerRepository.updateCustomer(
                customer,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'information-workflow/navigate-in',
                {
                    context: {
                        scenario: 'questionnaire:land',
                        entry: customer.data.entry,
                        customer: customer,
                    },
                },
            );
            return;
        }
    }
}
