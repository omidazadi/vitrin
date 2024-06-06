import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { TcommandParser } from 'src/infrastructures/parsers/tcommand-parser';
import { ShopCustomer } from '../../user-builder';
import { SectionRepository } from 'src/database/repositories/section-repository';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { ReferralPartnerRepository } from 'src/database/repositories/referral-partner-repository';
import { ShopProductWorkflowSectionTransitionerHelper } from '../product-workflow/helpers/section-transitioner';
import { ShopProductWorkflowRendererHelper } from '../product-workflow/helpers/renderer';

@Injectable()
export class ShopCommandWorkflowSetReferralHandler {
    private frontend: HydratedFrontend;
    private sectionRepository: SectionRepository;
    private customerRepository: CustomerRepository;
    private referralPartnerRepository: ReferralPartnerRepository;
    private sectionTransitionerHelper: ShopProductWorkflowSectionTransitionerHelper;
    private rendererHelper: ShopProductWorkflowRendererHelper;

    public constructor(
        frontend: HydratedFrontend,
        sectionRepository: SectionRepository,
        customerRepository: CustomerRepository,
        referralPartnerRepository: ReferralPartnerRepository,
        sectionTransitionerHelper: ShopProductWorkflowSectionTransitionerHelper,
        rendererHelper: ShopProductWorkflowRendererHelper,
    ) {
        this.frontend = frontend;
        this.sectionRepository = sectionRepository;
        this.customerRepository = customerRepository;
        this.referralPartnerRepository = referralPartnerRepository;
        this.sectionTransitionerHelper = sectionTransitionerHelper;
        this.rendererHelper = rendererHelper;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tcommandArgs: TcommandParser.TcommandArgs,
    ): Promise<void> {
        const shopCustomer = instanceToInstance(requestContext.user);
        if (typeof tcommandArgs?.data.referral !== 'undefined') {
            if (tcommandArgs.data.referral === 'null') {
                shopCustomer.customer.referral = null;
            } else {
                const referralPartner =
                    await this.referralPartnerRepository.getReferralPartner(
                        tcommandArgs.data.referral,
                        requestContext.user.shop.name,
                        requestContext.poolClient,
                    );
                if (referralPartner !== null) {
                    shopCustomer.customer.referral = referralPartner.name;
                }
            }
        }

        if (tcommandArgs?.data.landing === 'root') {
            const nullSections = await this.sectionRepository.getChildSections(
                null,
                requestContext.user.shop.name,
                requestContext.poolClient,
            );
            if (nullSections.length === 0) {
                await this.frontend.sendActionMessage(
                    requestContext.user.customer.tid,
                    'command-workflow/set-referral',
                    {
                        context: {
                            scenario: 'home:no-root-section',
                            landOn: 'root-section',
                        },
                    },
                );
                return;
            }

            const sectionChain = [nullSections[0]];
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
                'command-workflow/set-referral',
                transitionResult,
                {
                    extraContext: { landOn: 'root-section' },
                },
            );
        } else {
            shopCustomer.customer.data = { state: 'home' };
            await this.customerRepository.updateCustomer(
                shopCustomer.customer,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'command-workflow/set-referral',
                {
                    photo:
                        requestContext.user.shop.mainFileTid === null
                            ? undefined
                            : requestContext.user.shop.mainFileTid,
                    context: {
                        description: requestContext.user.shop.mainDescription,
                        landOn: 'home',
                    },
                },
            );
        }
    }
}
