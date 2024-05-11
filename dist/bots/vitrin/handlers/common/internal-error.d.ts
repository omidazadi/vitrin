import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VisitorRepository } from 'src/database/repositories/visitor-repository';
export declare class VitrinInternalErrorHandler {
    private frontend;
    private visitorRepository;
    constructor(frontend: HydratedFrontend, visitorRepository: VisitorRepository);
    handle(requestContext: RequestContext<Visitor>): Promise<void>;
}
