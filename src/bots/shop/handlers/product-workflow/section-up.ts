import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { SectionRepository } from 'src/database/repositories/section-repository';
import { ShopProductWorkflowSectionHandlingHelper } from './helpers/section-handling';
import { instanceToInstance } from 'class-transformer';
import { Section } from 'src/database/models/section';
import { CustomerRepository } from 'src/database/repositories/customer-repository';

@Injectable()
export class ShopProductWorkflowSectionUpHandler {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private sectionRepository: SectionRepository;
    private sectionHandlingHelper: ShopProductWorkflowSectionHandlingHelper;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        sectionRepository: SectionRepository,
        sectionHandlingHelper: ShopProductWorkflowSectionHandlingHelper,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.sectionRepository = sectionRepository;
        this.sectionHandlingHelper = sectionHandlingHelper;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<void> {
        if (requestContext.telegramContext.text === null) {
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'product-workflow/section-down',
                { context: { scenario: 'section:error-no-such-section' } },
            );
            return;
        }

        const customer = instanceToInstance(requestContext.user.customer);
        let sectionChain: Array<Section> = [];
        for (const sectionName of customer.data.sections) {
            const section = await this.sectionRepository.getSection(
                sectionName,
                requestContext.user.shop.name,
                requestContext.poolClient,
            );
            if (section === null) {
                throw new Error('Inconsistent section chain detected.');
            }

            sectionChain.push(section);
        }
        sectionChain.pop();

        if (sectionChain.length === 0) {
            customer.data = { state: 'home' };
            await this.customerRepository.updateCustomer(
                customer,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'product-workflow/section-up',
                {
                    photo:
                        requestContext.user.shop.mainFileTid === null
                            ? undefined
                            : requestContext.user.shop.mainFileTid,
                    context: {
                        scenario: 'section:home',
                        description: requestContext.user.shop.mainDescription,
                    },
                },
            );
            return;
        }

        await this.sectionHandlingHelper.sectionHandling(
            requestContext,
            customer,
            'product-workflow/section-up',
            sectionChain,
        );
    }
}
