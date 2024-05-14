import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { Customer } from 'src/database/models/customer';
import { TcommandParser } from 'src/infrastructures/tcommand-parser';
import { ShopRepository } from 'src/database/repositories/shop-repository';

@Injectable()
export class ShopHomeWorkflowJumpToHomeHandler {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private shopRepository: ShopRepository;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        shopRepository: ShopRepository,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.shopRepository = shopRepository;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<Customer>,
        tcommandArgs: TcommandParser.TcommandArgs,
    ): Promise<void> {
        const main = (
            await this.shopRepository.getShopForce(
                requestContext.user.shop,
                requestContext.poolClient,
            )
        ).mainDescription;
        const customer = instanceToInstance(requestContext.user);
        customer.data = { state: 'home' };
        await this.customerRepository.updateCustomer(
            customer,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'home-workflow/jump-to-home',
            { context: { description: main } },
        );
    }
}
