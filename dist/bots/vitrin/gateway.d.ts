import { Context as GrammyContext } from 'grammy';
import { ContextManager } from 'src/infrastructures/context/context-manager';
import { DatabaseManager } from 'src/infrastructures/database-manager';
import { GatewayInterface } from 'src/infrastructures/interfaces/gateway';
import { Logger } from 'src/infrastructures/logger';
import { VitrinRootRouter } from './routers/root-router';
import { Visitor } from 'src/database/models/visitor';
import { VitrinInternalErrorHandler } from './handlers/common/internal-error';
import { VitrinUnknownErrorHandler } from './handlers/common/unknown-error';
import { VitrinUnsupportedMediaErrorHandler } from './handlers/common/unsupported-media-error';
export declare class VitrinGateway implements GatewayInterface {
    private contextManager;
    private databaseManager;
    private router;
    private logger;
    private internalErrorHandler;
    private unknownErrorHandler;
    private unsupportedMediaErrorHandler;
    constructor(contextManager: ContextManager<Visitor>, databaseManager: DatabaseManager, router: VitrinRootRouter, logger: Logger, internalErrorHandler: VitrinInternalErrorHandler, unknownErrorHandler: VitrinUnknownErrorHandler, unsupportedMediaErrorHandler: VitrinUnsupportedMediaErrorHandler);
    initialize(): Promise<void>;
    recieve(grammyContext: GrammyContext): Promise<void>;
}
