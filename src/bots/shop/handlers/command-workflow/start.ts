import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { TcommandParser } from 'src/infrastructures/parsers/tcommand-parser';
import { ShopCustomer } from '../../user-builder';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { instanceToInstance } from 'class-transformer';
import { ShopCommandWorkflowTriggerExecuterHelper } from './helpers/trigger-executer';

@Injectable()
export class ShopCommandWorkflowStartHandler {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private triggerExecuterHelper: ShopCommandWorkflowTriggerExecuterHelper;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        triggerExecuterHelper: ShopCommandWorkflowTriggerExecuterHelper,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.triggerExecuterHelper = triggerExecuterHelper;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tcommandArgs: TcommandParser.TcommandArgs,
    ): Promise<void> {
        await this.triggerExecuterHelper.executeTrigger(requestContext);

        const customer = instanceToInstance(requestContext.user.customer);
        customer.data = { state: 'home' };
        await this.customerRepository.updateCustomer(
            customer,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'command-workflow/start',
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
