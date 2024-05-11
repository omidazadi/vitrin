import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { VitrinAdminWorkflowRouter } from './admin-workflow-router';
import { Visitor } from 'src/database/models/visitor';
import { VitrinCommandRouter } from './command-router';

@Injectable()
export class VitrinRootRouter {
    private commandRouter: VitrinCommandRouter;
    private adminWorkflowRouter: VitrinAdminWorkflowRouter;

    public constructor(
        commandRouter: VitrinCommandRouter,
        adminWorkflowRouter: VitrinAdminWorkflowRouter,
    ) {
        this.commandRouter = commandRouter;
        this.adminWorkflowRouter = adminWorkflowRouter;
    }

    public async route(
        requestContext: RequestContext<Visitor>,
    ): Promise<boolean> {
        if (await this.commandRouter.route(requestContext)) {
            return true;
        } else if (await this.adminWorkflowRouter.route(requestContext)) {
            return true;
        } else {
            return false;
        }
    }

    public async internalError(
        requestContext: RequestContext<Visitor>,
    ): Promise<void> {}
}
