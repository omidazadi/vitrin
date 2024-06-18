import { Injectable } from '@nestjs/common';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ReferralPartnerRepository } from 'src/database/repositories/referral-partner-repository';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { PurchaseRepository } from 'src/database/repositories/purchase-repository';

@Injectable()
export class VitrinReferralPanelWorkflowShowStatisticsHandler {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private purchaseRepository: PurchaseRepository;
    private referralPartnerRepository: ReferralPartnerRepository;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        purchaseRepository: PurchaseRepository,
        referralPartnerRepository: ReferralPartnerRepository,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.purchaseRepository = purchaseRepository;
        this.referralPartnerRepository = referralPartnerRepository;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<Visitor>,
    ): Promise<void> {
        const [shopName, referralName] =
            requestContext.telegramContext.text!.split(':');
        const referral =
            await this.referralPartnerRepository.getReferralPartner(
                referralName,
                shopName,
                requestContext.poolClient,
            );
        if (referral === null) {
            await this.frontend.sendActionMessage(
                requestContext.user.tid,
                'common/unknown-error',
            );
            return;
        }

        const totalCustomers =
            await this.customerRepository.getNumberOfReferralCustomers(
                referral.name,
                referral.shop,
                requestContext.poolClient,
            );
        const totalPurchases =
            await this.purchaseRepository.getTotalReferralPurchaseCount(
                referral.name,
                referral.shop,
                requestContext.poolClient,
            );
        const totalFee =
            await this.purchaseRepository.getTotalReferralPurchaseSum(
                referral.name,
                referral.shop,
                requestContext.poolClient,
            );
        const currentPurchases =
            await this.purchaseRepository.getCurrentReferralPurchaseCount(
                referral.name,
                referral.shop,
                requestContext.poolClient,
            );
        const currentFee =
            await this.purchaseRepository.getCurrentReferralPurchaseSum(
                referral.name,
                referral.shop,
                requestContext.poolClient,
            );

        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'referral-panel-workflow/show-statistics',
            {
                context: {
                    referral: referral,
                    totalCustomers: totalCustomers,
                    totalPurchases: totalPurchases,
                    totalFee: totalFee,
                    currentPurchases: currentPurchases,
                    currentFee: currentFee,
                },
            },
        );
    }
}
