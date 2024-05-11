import { Bot as GrammyBot } from 'grammy';
import { GatewayInterface } from './interfaces/gateway';
import { Logger } from './logger';
export declare class BotRunner {
    private grammyBot;
    private gateway;
    private logger;
    constructor(grammyBot: GrammyBot, gateway: GatewayInterface, logger: Logger);
    run(): Promise<void>;
}
