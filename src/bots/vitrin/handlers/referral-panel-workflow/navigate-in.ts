import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VisitorRepository } from 'src/database/repositories/visitor-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ReferralPartnerRepository } from 'src/database/repositories/referral-partner-repository';

@Injectable()
export class VitrinReferralPanelWorkflowNavigateInHandler {
    private frontend: HydratedFrontend;
    private visitorRepository: VisitorRepository;
    private referralPartnerRepository: ReferralPartnerRepository;

    public constructor(
        frontend: HydratedFrontend,
        visitorRepository: VisitorRepository,
        referralPartnerRepository: ReferralPartnerRepository,
    ) {
        this.frontend = frontend;
        this.visitorRepository = visitorRepository;
        this.referralPartnerRepository = referralPartnerRepository;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<Visitor>,
    ): Promise<void> {
        const visitor = instanceToInstance(requestContext.user);
        const referrals =
            await this.referralPartnerRepository.getReferralPartnersByVisitor(
                visitor.id,
                requestContext.poolClient,
            );
        if (referrals.length === 0) {
            await this.frontend.sendActionMessage(
                requestContext.user.tid,
                'common/unknown-error',
            );
            return;
        }

        visitor.data = { state: 'referral-panel' };
        await this.visitorRepository.updateVisitor(
            visitor,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'referral-panel-workflow/navigate-in',
            { context: { referrals: referrals } },
        );
    }
}
