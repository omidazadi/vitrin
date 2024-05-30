import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { SectionRepository } from 'src/database/repositories/section-repository';
import { ShopProductWorkflowSectionHandlingHelper } from './helpers/section-handling';
import { instanceToInstance } from 'class-transformer';
import { Section } from 'src/database/models/section';

@Injectable()
export class ShopProductWorkflowSectionDownHandler {
    private frontend: HydratedFrontend;
    private sectionRepository: SectionRepository;
    private sectionHandlingHelper: ShopProductWorkflowSectionHandlingHelper;

    public constructor(
        frontend: HydratedFrontend,
        sectionRepository: SectionRepository,
        sectionHandlingHelper: ShopProductWorkflowSectionHandlingHelper,
    ) {
        this.frontend = frontend;
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

        const destinationSection =
            await this.sectionRepository.getChildSectionByFullName(
                customer.data.sections[customer.data.sections.length - 1],
                requestContext.telegramContext.text,
                requestContext.user.shop.name,
                requestContext.poolClient,
            );
        if (destinationSection === null) {
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'product-workflow/section-down',
                { context: { scenario: 'section:error-no-such-section' } },
            );
            return;
        }
        sectionChain.push(destinationSection);

        await this.sectionHandlingHelper.sectionHandling(
            requestContext,
            customer,
            'product-workflow/section-down',
            sectionChain,
        );
    }
}
