import { RequestContext } from 'src/infrastructures/context/request-context';
import { VitrinAdminWorkflowRouter } from './admin-workflow-router';
import { Visitor } from 'src/database/models/visitor';
import { VitrinCommandRouter } from './command-router';
export declare class VitrinRootRouter {
    private commandRouter;
    private adminWorkflowRouter;
    constructor(commandRouter: VitrinCommandRouter, adminWorkflowRouter: VitrinAdminWorkflowRouter);
    route(requestContext: RequestContext<Visitor>): Promise<boolean>;
    internalError(requestContext: RequestContext<Visitor>): Promise<void>;
}
