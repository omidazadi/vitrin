import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
export declare class VitrinUnsupportedMediaErrorHandler {
    private frontend;
    constructor(frontend: HydratedFrontend);
    handle(requestContext: RequestContext<Visitor>): Promise<void>;
}
