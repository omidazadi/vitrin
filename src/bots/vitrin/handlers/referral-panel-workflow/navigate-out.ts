import { Injectable } from '@nestjs/common';
import { Bot as GrammyBot } from 'grammy';
import { instanceToInstance } from 'class-transformer';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VisitorRepository } from 'src/database/repositories/visitor-repository';
import { VitrinConfig } from '../../configs/vitrin-config';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ReferralPartnerRepository } from 'src/database/repositories/referral-partner-repository';

@Injectable()
export class VitrinReferralPanelWorkflowNavigateOutHandler {
    private frontend: HydratedFrontend;
    private visitorRepository: VisitorRepository;
    private referralPartnerRepository: ReferralPartnerRepository;
    private grammyBot: GrammyBot;
    private vitrinConfig: VitrinConfig;

    public constructor(
        frontend: HydratedFrontend,
        visitorRepository: VisitorRepository,
        referralPartnerRepository: ReferralPartnerRepository,
        grammyBot: GrammyBot,
        vitrinConfig: VitrinConfig,
    ) {
        this.frontend = frontend;
        this.visitorRepository = visitorRepository;
        this.referralPartnerRepository = referralPartnerRepository;
        this.grammyBot = grammyBot;
        this.vitrinConfig = vitrinConfig;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<Visitor>,
    ): Promise<void> {
        const ownerUsername = (
            (await this.grammyBot.api.getChat(
                parseInt(this.vitrinConfig.owner),
            )) as any
        ).username;
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
            'referral-panel-workflow/navigate-out',
            { context: { owner: ownerUsername, referrals: referrals } },
        );
    }
}
