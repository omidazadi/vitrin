import { Bot as GrammyBot } from 'grammy';
import { LoggerConfig } from './configs/logger-config';
import { DryFrontend } from './frontend/dry-frontend';
export declare class Logger {
    private frontend;
    private grammyBot;
    private loggerConfig;
    private logChannelTid;
    constructor(frontend: DryFrontend, grammyBot: GrammyBot, loggerConfig: LoggerConfig);
    configure(): Promise<void>;
    log(message: string): Promise<void>;
    warn(message: string): Promise<void>;
}
