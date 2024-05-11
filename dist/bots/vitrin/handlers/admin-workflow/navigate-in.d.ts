import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { VitrinConfig } from '../../configs/vitrin-config';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VisitorRepository } from 'src/database/repositories/visitor-repository';
export declare class VitrinAdminWorkflowNavigateInHandler {
    private vitrinConfig;
    private frontend;
    private visitorRepository;
    constructor(vitrinConfig: VitrinConfig, frontend: HydratedFrontend, visitorRepository: VisitorRepository);
    handle(requestContext: RequestContext<Visitor>): Promise<void>;
}
