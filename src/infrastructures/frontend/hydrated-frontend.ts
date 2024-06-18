import { Injectable } from '@nestjs/common';
import { GrammyError } from 'grammy';
import { Logger } from '../logger';
import { DryFrontend } from './dry-frontend';

@Injectable()
export class HydratedFrontend {
    private dryFrontend: DryFrontend;
    private logger: Logger;

    public constructor(dryFrontend: DryFrontend, logger: Logger) {
        this.dryFrontend = dryFrontend;
        this.logger = logger;
    }

    public async sendActionMessage(
        tid: string,
        action: string,
        options?: {
            forcedType?: 'keyboard' | 'inline' | 'url' | 'none';
            replyTo?: string;
            context?: object;
            album?: Array<string>;
            photo?: string;
            video?: string;
        },
    ): Promise<string | null> {
        try {
            return await this.dryFrontend.sendActionMessage(
                tid,
                action,
                options,
            );
        } catch (e: unknown) {
            if (e instanceof GrammyError) {
                await this.logger.warn(e.toString());
                return null;
            } else {
                throw e;
            }
        }
    }

    public async modifyActionMessage(
        userTid: string,
        messageTid: string,
        action: string,
        options?: {
            forcedType?: 'keyboard' | 'inline' | 'url' | 'none';
            context?: object;
            photo?: string;
            video?: string;
        },
    ): Promise<void> {
        try {
            await this.dryFrontend.modifyActionMessage(
                userTid,
                messageTid,
                action,
                options,
            );
        } catch (e: unknown) {
            if (e instanceof GrammyError) {
                await this.logger.warn(e.toString());
                return;
            } else {
                throw e;
            }
        }
    }

    public async sendSystemMessage(
        tid: string,
        messageType: string,
        options?: {
            forcedType?: 'keyboard' | 'inline' | 'url' | 'none';
            replyTo?: string;
            context?: object;
            album?: Array<string>;
            photo?: string;
            video?: string;
        },
    ): Promise<string | null> {
        try {
            return await this.dryFrontend.sendSystemMessage(
                tid,
                messageType,
                options,
            );
        } catch (e: unknown) {
            if (e instanceof GrammyError) {
                await this.logger.warn(e.toString());
                return null;
            } else {
                throw e;
            }
        }
    }
}
