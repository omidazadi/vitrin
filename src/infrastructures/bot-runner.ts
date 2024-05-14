import { Inject, Injectable } from '@nestjs/common';
import { Bot as GrammyBot } from 'grammy';
import { GatewayInterface } from './interfaces/gateway';
import { Logger } from './logger';
import { setTimeout } from 'timers/promises';

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

    public async run(
        preInitializeData: any = undefined,
        postInitializeData: any = undefined,
    ): Promise<void> {
        await this.gateway.preInitialize(preInitializeData);
        this.grammyBot.on('message', this.gateway.recieve.bind(this.gateway));
        this.grammyBot.start();
        while (!this.grammyBot.isInited()) {
            await setTimeout(500);
        }
        await this.gateway.postInitialize(postInitializeData);
        await this.logger.log('Bot is live.');
    }
}
