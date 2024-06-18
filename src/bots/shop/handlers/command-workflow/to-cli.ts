import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { ShopCustomer } from '../../user-builder';
import { VisitorRepository } from 'src/database/repositories/visitor-repository';
import { ShopCommandWorkflowTriggerExecuterHelper } from './helpers/trigger-executer';

@Injectable()
export class ShopCommandWorkflowToCliHandler {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private visitorRepository: VisitorRepository;
    private triggerExecuterHelper: ShopCommandWorkflowTriggerExecuterHelper;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        visitorRepository: VisitorRepository,
        triggerExecuterHelper: ShopCommandWorkflowTriggerExecuterHelper,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.visitorRepository = visitorRepository;
        this.triggerExecuterHelper = triggerExecuterHelper;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<void> {
        const visitor = await this.visitorRepository.getVisitorByTid(
            requestContext.user.customer.tid,
            requestContext.poolClient,
        );
        if (visitor === null || visitor.id !== requestContext.user.shop.owner) {
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'common/unknown-error',
            );
            return;
        }

        await this.triggerExecuterHelper.executeTrigger(requestContext);

        const customer = instanceToInstance(requestContext.user.customer);
        customer.data = { state: 'admin-cli' };
        await this.customerRepository.updateCustomer(
            customer,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/navigate-in',
        );
    }
}
