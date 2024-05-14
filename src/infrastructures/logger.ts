import { Injectable } from '@nestjs/common';
import { Bot as GrammyBot } from 'grammy';
import { LoggerConfig } from './configs/logger-config';
import { DryFrontend } from './frontend/dry-frontend';

@Injectable()
export class Logger {
    private frontend: DryFrontend;
    private grammyBot: GrammyBot;
    private loggerConfig: LoggerConfig;
    private logChannelTid: string;

    public constructor(
        frontend: DryFrontend,
        grammyBot: GrammyBot,
        loggerConfig: LoggerConfig,
    ) {
        this.frontend = frontend;
        this.grammyBot = grammyBot;
        this.loggerConfig = loggerConfig;
        this.logChannelTid = '';
    }

    public async configure() {
        this.logChannelTid = (
            await this.grammyBot.api.getChat(
                '@' + this.loggerConfig.channelUsername,
            )
        ).id.toString();
    }

    public async isJoinedInLogChannel(): Promise<boolean> {
        const getChatMemberResult = await this.grammyBot.api.getChatMember(
            parseInt(this.logChannelTid),
            this.grammyBot.botInfo.id,
        );
        if (
            getChatMemberResult.status === 'left' ||
            getChatMemberResult.status === 'kicked'
        ) {
            return false;
        }
        return true;
    }

    public async log(message: string) {
        await this.frontend.sendSystemMessage(this.logChannelTid, 'log', {
            context: {
                message: message,
                severity: 'log',
                date: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Tehran',
                }),
            },
        });
    }

    public async warn(message: string) {
        if (typeof this.frontend === 'undefined') {
            return;
        }

        await this.frontend.sendSystemMessage(this.logChannelTid, 'warn', {
            context: {
                message: message,
                severity: 'warn',
                date: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Tehran',
                }),
            },
        });
    }
}
