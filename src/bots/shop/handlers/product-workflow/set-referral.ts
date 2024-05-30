import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ReferralPartnerRepository } from 'src/database/repositories/referral-partner-repository';
import { TcommandParser } from 'src/infrastructures/parsers/tcommand-parser';
import { ShopCustomer } from '../../user-builder';
import { SectionRepository } from 'src/database/repositories/section-repository';
import { ShopProductWorkflowSectionHandlingHelper } from './helpers/section-handling';

@Injectable()
export class ShopProductWorkflowSetReferralHandler {
    private frontend: HydratedFrontend;
    private sectionRepository: SectionRepository;
    private referralPartnerRepository: ReferralPartnerRepository;
    private sectionHandlingHelper: ShopProductWorkflowSectionHandlingHelper;

    public constructor(
        frontend: HydratedFrontend,
        sectionRepository: SectionRepository,
        referralPartnerRepository: ReferralPartnerRepository,
        sectionHandlingHelper: ShopProductWorkflowSectionHandlingHelper,
    ) {
        this.frontend = frontend;
        this.sectionRepository = sectionRepository;
        this.referralPartnerRepository = referralPartnerRepository;
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
        const customer = instanceToInstance(requestContext.user.customer);
        if (typeof tcommandArgs?.data.referral !== 'undefined') {
            if (tcommandArgs.data.referral === 'null') {
                customer.referral = null;
            } else {
                const referralPartner =
                    await this.referralPartnerRepository.getReferralPartner(
                        tcommandArgs.data.referral,
                        requestContext.user.shop.name,
                        requestContext.poolClient,
                    );
                if (referralPartner !== null) {
                    customer.referral = referralPartner.name;
                }
            }
        }

        const nullSections = await this.sectionRepository.getChildSections(
            null,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (nullSections.length === 0) {
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'product-workflow/set-referral',
                { context: { scenario: 'section:error-no-root-section' } },
            );
            return;
        }

        const section = nullSections[0];
        await this.sectionHandlingHelper.sectionHandling(
            requestContext,
            customer,
            'product-workflow/set-referral',
            [section],
        );
    }
}
