import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { VitrinHomeWorkflowJumpToHomeHandler } from '../handlers/home-workflow/jump-to-home';
import { VitrinAdminWorkflowNavigateInHandler } from '../handlers/admin-workflow/navigate-in';
export declare class VitrinCommandRouter {
    private uiPath;
    private homeWorkflowjumpToHomeHandler;
    private adminWorkflowNavigateInHandler;
    private buttonTexts;
    constructor(uiPath: string, homeWorkflowjumpToHomeHandler: VitrinHomeWorkflowJumpToHomeHandler, adminWorkflowNavigateInHandler: VitrinAdminWorkflowNavigateInHandler);
    configure(): Promise<void>;
    route(requestContext: RequestContext<Visitor>): Promise<boolean>;
}
