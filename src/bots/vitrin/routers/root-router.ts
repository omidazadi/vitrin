import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { VitrinAdminWorkflowRouter } from './admin-workflow-router';
import { Visitor } from 'src/database/models/visitor';
import { VitrinCommandRouter } from './command-router';
import { VitrinHomeWorkflowRouter } from './home-workflow-router';
import { VitrinReferralPanelWorkflowRouter } from './referral-panel-workflow-router';

@Injectable()
export class VitrinRootRouter {
    private commandRouter: VitrinCommandRouter;
    private adminWorkflowRouter: VitrinAdminWorkflowRouter;
    private homeWorkflowRouter: VitrinHomeWorkflowRouter;
    private referralPanelWorkflowRouter: VitrinReferralPanelWorkflowRouter;

    public constructor(
        commandRouter: VitrinCommandRouter,
        adminWorkflowRouter: VitrinAdminWorkflowRouter,
        homeWorkflowRouter: VitrinHomeWorkflowRouter,
        referralPanelWorkflowRouter: VitrinReferralPanelWorkflowRouter,
    ) {
        this.commandRouter = commandRouter;
        this.adminWorkflowRouter = adminWorkflowRouter;
        this.homeWorkflowRouter = homeWorkflowRouter;
        this.referralPanelWorkflowRouter = referralPanelWorkflowRouter;
    }

    public async route(
        requestContext: RequestContext<Visitor>,
    ): Promise<boolean> {
        if (await this.commandRouter.route(requestContext)) {
            return true;
        } else if (await this.adminWorkflowRouter.route(requestContext)) {
            return true;
        } else if (await this.homeWorkflowRouter.route(requestContext)) {
            return true;
        } else if (
            await this.referralPanelWorkflowRouter.route(requestContext)
        ) {
            return true;
        } else {
            return false;
        }
    }
}
