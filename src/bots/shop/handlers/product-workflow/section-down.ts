import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { SectionRepository } from 'src/database/repositories/section-repository';
import { ShopProductWorkflowSectionChainBuilderHelper } from './helpers/section-chain-builder';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { ShopProductWorkflowSectionTransitionerHelper } from './helpers/section-transitioner';
import { ShopProductWorkflowRendererHelper } from './helpers/renderer';
import { instanceToInstance } from 'class-transformer';

@Injectable()
export class ShopProductWorkflowSectionDownHandler {
    private frontend: HydratedFrontend;
    private sectionRepository: SectionRepository;
    private customerRepository: CustomerRepository;
    private sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper;
    private sectionTransitionerHelper: ShopProductWorkflowSectionTransitionerHelper;
    private rendererHelper: ShopProductWorkflowRendererHelper;

    public constructor(
        frontend: HydratedFrontend,
        sectionRepository: SectionRepository,
        customerRepository: CustomerRepository,
        sectionChainBuilderHelper: ShopProductWorkflowSectionChainBuilderHelper,
        sectionTransitionerHelper: ShopProductWorkflowSectionTransitionerHelper,
        rendererHelper: ShopProductWorkflowRendererHelper,
    ) {
        this.frontend = frontend;
        this.sectionRepository = sectionRepository;
        this.customerRepository = customerRepository;
        this.sectionChainBuilderHelper = sectionChainBuilderHelper;
        this.sectionTransitionerHelper = sectionTransitionerHelper;
        this.rendererHelper = rendererHelper;
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
        if (requestContext.telegramContext.text === null) {
            const section = sectionChain[sectionChain.length - 1];
            const childSections = await this.sectionRepository.getChildSections(
                section.name,
                section.shop,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'product-workflow/section-down',
                {
                    context: {
                        scenario: 'section:no-such-section',
                        section: section,
                        childSections: childSections,
                    },
                },
            );
            return;
        }

        const destinationSection =
            await this.sectionRepository.getChildSectionByFullName(
                requestContext.user.customer.data.section,
                requestContext.telegramContext.text,
                requestContext.user.shop.name,
                requestContext.poolClient,
            );
        if (destinationSection === null) {
            const section = sectionChain[sectionChain.length - 1];
            const childSections = await this.sectionRepository.getChildSections(
                section.name,
                section.shop,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'product-workflow/section-down',
                {
                    context: {
                        scenario: 'section:no-such-section',
                        section: section,
                        childSections: childSections,
                    },
                },
            );
            return;
        }
        sectionChain.push(destinationSection);

        const shopCustomer = instanceToInstance(requestContext.user);
        const transitionResult =
            await this.sectionTransitionerHelper.transition(
                requestContext,
                shopCustomer,
                sectionChain,
            );
        await this.customerRepository.updateCustomer(
            shopCustomer.customer,
            requestContext.poolClient,
        );
        await this.rendererHelper.render(
            requestContext,
            shopCustomer,
            'product-workflow/section-down',
            transitionResult,
        );
    }
}
