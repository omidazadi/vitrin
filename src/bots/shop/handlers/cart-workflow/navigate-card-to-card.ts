import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { instanceToInstance } from 'class-transformer';
import { CustomerRepository } from 'src/database/repositories/customer-repository';

@Injectable()
export class ShopCartWorkflowNavigateCardToCardHandler {
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
            requestContext.user.shop.supportUsername !== null &&
            requestContext.user.shop.cardNumber !== null &&
            requestContext.user.shop.cardOwner !== null
        ) {
            customer.data = {
                state: 'card-to-card',
                purchaseUid: customer.data.purchaseUid,
            };
            await this.customerRepository.updateCustomer(
                customer,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'cart-workflow/navigate-card-to-card',
                {
                    context: {
                        scenario: 'success',
                        shop: requestContext.user.shop,
                    },
                },
            );
        } else {
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'cart-workflow/navigate-card-to-card',
                {
                    context: {
                        scenario: 'no-card-error',
                    },
                },
            );
        }
    }
}
