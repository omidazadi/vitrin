import { Inject, Injectable } from '@nestjs/common';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { VitrinReferralPanelWorkflowNavigateOutHandler } from '../handlers/referral-panel-workflow/navigate-out';
import { VitrinReferralPanelWorkflowShowStatisticsHandler } from '../handlers/referral-panel-workflow/show-statistics';

@Injectable()
export class VitrinReferralPanelWorkflowRouter {
    private navigateOutHandler: VitrinReferralPanelWorkflowNavigateOutHandler;
    private showStatisticsHandler: VitrinReferralPanelWorkflowShowStatisticsHandler;
    private buttonTexts: any;

    public constructor(
        navigateOutHandler: VitrinReferralPanelWorkflowNavigateOutHandler,
        showStatisticsHandler: VitrinReferralPanelWorkflowShowStatisticsHandler,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.navigateOutHandler = navigateOutHandler;
        this.showStatisticsHandler = showStatisticsHandler;
        this.buttonTexts = buttonTexts;
    }

    public async route(
        requestContext: RequestContext<Visitor>,
    ): Promise<boolean> {
        if (requestContext.user.data.state === 'referral-panel') {
            if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.admin_cli.back
            ) {
                await this.navigateOutHandler.handle(requestContext);
                return true;
            } else {
                await this.showStatisticsHandler.handle(requestContext);
                return true;
            }
        } else {
            return false;
        }
    }
}
