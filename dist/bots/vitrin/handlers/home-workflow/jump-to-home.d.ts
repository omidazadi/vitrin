import { Bot as GrammyBot } from 'grammy';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VisitorRepository } from 'src/database/repositories/visitor-repository';
import { VitrinConfig } from '../../configs/vitrin-config';
export declare class VitrinHomeWorkflowJumpToHomeHandler {
    private frontend;
    private visitorRepository;
    private grammyBot;
    private vitrinConfig;
    constructor(frontend: HydratedFrontend, visitorRepository: VisitorRepository, grammyBot: GrammyBot, vitrinConfig: VitrinConfig);
    handle(requestContext: RequestContext<Visitor>): Promise<void>;
}
