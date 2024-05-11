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
            context?: object;
            photo?: string;
        },
    ): Promise<boolean> {
        try {
            await this.dryFrontend.sendActionMessage(tid, action, options);
            return true;
        } catch (e: unknown) {
            if (e instanceof GrammyError) {
                await this.logger.warn(e.toString());
                return false;
            } else {
                throw e;
            }
        }
    }

    public async sendSystemMessage(
        tid: string,
        messageType: string,
        options?: {
            context?: object;
            photo?: string;
        },
    ): Promise<boolean> {
        try {
            await this.dryFrontend.sendSystemMessage(tid, messageType, options);
            return true;
        } catch (e: unknown) {
            if (e instanceof GrammyError) {
                await this.logger.warn(e.toString());
                return false;
            } else {
                throw e;
            }
        }
    }
}
