import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { VitrinHomeWorkflowJumpToHomeHandler } from '../handlers/home-workflow/jump-to-home';
export declare class VitrinHomeWorkflowRouter {
    private uiPath;
    private jumpToHomeHandler;
    private buttonTexts;
    constructor(uiPath: string, jumpToHomeHandler: VitrinHomeWorkflowJumpToHomeHandler);
    configure(): Promise<void>;
    route(requestContext: RequestContext<Visitor>): Promise<boolean>;
}
