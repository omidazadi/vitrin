import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { VitrinAdminWorkflowCommandHandler } from '../handlers/admin-workflow/command';
import { VitrinAdminWorkflowNavigateOutHandler } from '../handlers/admin-workflow/navigate-out';
export declare class VitrinAdminWorkflowRouter {
    private uiPath;
    private commandHandler;
    private navigateOutHandler;
    private buttonTexts;
    constructor(uiPath: string, commandHandler: VitrinAdminWorkflowCommandHandler, navigateOutHandler: VitrinAdminWorkflowNavigateOutHandler);
    configure(): Promise<void>;
    route(requestContext: RequestContext<Visitor>): Promise<boolean>;
}
