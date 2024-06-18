import { Inject, Injectable } from '@nestjs/common';
import { Bot as GrammyBot } from 'grammy';
import { GatewayInterface } from './interfaces/gateway';
import { Logger } from './logger';

@Injectable()
export class BotRunner {
    private grammyBot: GrammyBot;
    private gateway: GatewayInterface;
    private logger: Logger;

    public constructor(
        grammyBot: GrammyBot,
        @Inject('GATEWAY') gateway: GatewayInterface,
        logger: Logger,
    ) {
        this.grammyBot = grammyBot;
        this.gateway = gateway;
        this.logger = logger;
    }

    public async run(initializationData: any = undefined): Promise<void> {
        this.grammyBot.on('message', this.gateway.recieve.bind(this.gateway));
        this.grammyBot.start();
        await this.grammyBot.init();
        await this.gateway.initialize(initializationData);
        await this.logger.log('Bot is live.');
    }
}
