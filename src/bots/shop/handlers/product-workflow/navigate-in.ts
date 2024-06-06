import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { SectionRepository } from 'src/database/repositories/section-repository';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { ShopProductWorkflowSectionTransitionerHelper } from './helpers/section-transitioner';
import { ShopProductWorkflowRendererHelper } from './helpers/renderer';
import { instanceToInstance } from 'class-transformer';

@Injectable()
export class ShopProductWorkflowNavigateInHandler {
    private frontend: HydratedFrontend;
    private sectionRepository: SectionRepository;
    private customerRepository: CustomerRepository;
    private sectionTransitionerHelper: ShopProductWorkflowSectionTransitionerHelper;
    private rendererHelper: ShopProductWorkflowRendererHelper;

    public constructor(
        frontend: HydratedFrontend,
        sectionRepository: SectionRepository,
        customerRepository: CustomerRepository,
        sectionTransitionerHelper: ShopProductWorkflowSectionTransitionerHelper,
        rendererHelper: ShopProductWorkflowRendererHelper,
    ) {
        this.frontend = frontend;
        this.sectionRepository = sectionRepository;
        this.customerRepository = customerRepository;
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
        const nullSections = await this.sectionRepository.getChildSections(
            null,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (nullSections.length === 0) {
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'product-workflow/navigate-in',
                { context: { scenario: 'home:no-root-section' } },
            );
            return;
        }

        const sectionChain = [nullSections[0]];
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
            'product-workflow/navigate-in',
            transitionResult,
        );
    }
}
