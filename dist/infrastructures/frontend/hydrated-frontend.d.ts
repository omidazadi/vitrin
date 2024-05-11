import { Logger } from '../logger';
import { DryFrontend } from './dry-frontend';
export declare class HydratedFrontend {
    private dryFrontend;
    private logger;
    constructor(dryFrontend: DryFrontend, logger: Logger);
    sendActionMessage(tid: string, action: string, options?: {
        context?: object;
        photo?: string;
    }): Promise<boolean>;
    sendSystemMessage(tid: string, messageType: string, options?: {
        context?: object;
        photo?: string;
    }): Promise<boolean>;
}
