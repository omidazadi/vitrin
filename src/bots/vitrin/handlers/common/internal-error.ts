import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VisitorRepository } from 'src/database/repositories/visitor-repository';
import { ReferralPartnerRepository } from 'src/database/repositories/referral-partner-repository';

@Injectable()
export class VitrinInternalErrorHandler {
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

    public async handle(
        requestContext: RequestContext<Visitor>,
    ): Promise<void> {
        const visitor = instanceToInstance(requestContext.user);
        const referrals =
            await this.referralPartnerRepository.getReferralPartnersByVisitor(
                visitor.id,
                requestContext.poolClient,
            );
        visitor.data = { state: 'home' };
        await this.visitorRepository.updateVisitor(
            visitor,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'common/internal-error',
            { context: { referrals: referrals } },
        );
    }
}
