import { Inject, Injectable } from '@nestjs/common';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { VitrinReferralPanelWorkflowNavigateInHandler } from '../handlers/referral-panel-workflow/navigate-in';

@Injectable()
export class VitrinHomeWorkflowRouter {
    private referralPanelWorkflowNavigateInHandler: VitrinReferralPanelWorkflowNavigateInHandler;
    private buttonTexts: any;

    public constructor(
        referralPanelWorkflowNavigateInHandler: VitrinReferralPanelWorkflowNavigateInHandler,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.referralPanelWorkflowNavigateInHandler =
            referralPanelWorkflowNavigateInHandler;
        this.buttonTexts = buttonTexts;
    }

    public async route(
        requestContext: RequestContext<Visitor>,
    ): Promise<boolean> {
        if (requestContext.user.data.state === 'home') {
            if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.home.referral_panel
            ) {
                await this.referralPanelWorkflowNavigateInHandler.handle(
                    requestContext,
                );
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}
