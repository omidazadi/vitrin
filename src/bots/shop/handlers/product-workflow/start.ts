import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { TcommandParser } from 'src/infrastructures/parsers/tcommand-parser';
import { ShopCustomer } from '../../user-builder';
import { SectionRepository } from 'src/database/repositories/section-repository';
import { ShopProductWorkflowSectionHandlingHelper } from './helpers/section-handling';
import { instanceToInstance } from 'class-transformer';

@Injectable()
export class ShopProductWorkflowStartHandler {
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
        tcommandArgs: TcommandParser.TcommandArgs,
    ): Promise<void> {
        const nullSections = await this.sectionRepository.getChildSections(
            null,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (nullSections.length === 0) {
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'product-workflow/start',
                { context: { scenario: 'section:error-no-root-section' } },
            );
            return;
        }

        const section = nullSections[0];
        const customer = instanceToInstance(requestContext.user.customer);
        await this.sectionHandlingHelper.sectionHandling(
            requestContext,
            customer,
            'product-workflow/start',
            [section],
        );
    }
}
