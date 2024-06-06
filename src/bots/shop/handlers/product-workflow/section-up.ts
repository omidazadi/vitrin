import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { instanceToInstance } from 'class-transformer';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { ShopProductWorkflowSectionChainBuilderHelper } from './helpers/section-chain-builder';
import { SectionRepository } from 'src/database/repositories/section-repository';

@Injectable()
export class ShopProductWorkflowSectionUpHandler {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private sectionRepository: SectionRepository;
    private sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        sectionRepository: SectionRepository,
        sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.sectionRepository = sectionRepository;
        this.sectionChainBuilderHelper = sectionChainBuilderHelper;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<void> {
        const sectionChain =
            await this.sectionChainBuilderHelper.buildSectionChain(
                requestContext,
                requestContext.user.customer.data.section,
            );
        sectionChain.pop();

        const shopCustomer = instanceToInstance(requestContext.user);
        if (sectionChain.length === 0) {
            shopCustomer.customer.data = { state: 'home' };
            await this.customerRepository.updateCustomer(
                shopCustomer.customer,
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
                        scenario: 'home:land',
                        description: requestContext.user.shop.mainDescription,
                    },
                },
            );
            return;
        }

        shopCustomer.customer.data = {
            state: 'section',
            section: sectionChain[sectionChain.length - 1].name,
        };
        await this.customerRepository.updateCustomer(
            shopCustomer.customer,
            requestContext.poolClient,
        );
        const section = sectionChain[sectionChain.length - 1];
        const childSections = await this.sectionRepository.getChildSections(
            section.name,
            section.shop,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'product-workflow/section-up',
            {
                context: {
                    scenario: 'section:land',
                    section: section,
                    childSections: childSections,
                },
            },
        );
    }
}
