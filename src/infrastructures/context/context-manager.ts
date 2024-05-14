import { Inject, Injectable } from '@nestjs/common';
import { Context as GrammyContext } from 'grammy';
import { RequestContext } from './request-context';
import { DatabaseManager } from '../database-manager';
import { TelegramContext } from './telegram-context';
import { UserBuilderInterface } from '../interfaces/user-builder';

@Injectable()
export class ContextManager<T> {
    private databaseManager: DatabaseManager;
    private userBuilder: UserBuilderInterface<T>;

    public constructor(
        databaseManager: DatabaseManager,
        @Inject('USER_BUILDER') userBuilder: UserBuilderInterface<T>,
    ) {
        this.databaseManager = databaseManager;
        this.userBuilder = userBuilder;
    }

    public async buildRequestContext(
        grammyContext: GrammyContext,
    ): Promise<RequestContext<T>> {
        const poolClient = await this.databaseManager.createTransaction();
        const telegramContext = this.buildTelegramContext(grammyContext);
        try {
            let user = await this.userBuilder.buildUser(
                telegramContext,
                poolClient,
            );
            return new RequestContext<T>(telegramContext, user, poolClient);
        } catch (e: unknown) {
            await this.databaseManager.rollbackTransaction(poolClient);
            throw e;
        }
    }

    public buildTelegramContext(grammyContext: GrammyContext): TelegramContext {
        let [tid, text, photo, video]: [
            string | null,
            string | null,
            string | null,
            string | null,
        ] = [null, null, null, null];

        if (typeof grammyContext.from !== 'undefined') {
            tid = grammyContext.from.id.toString();
        } else {
            throw new Error(
                'Could not identify the source of telegram request.',
            );
        }

        if (typeof grammyContext.message !== 'undefined') {
            if (typeof grammyContext.message.photo !== 'undefined') {
                photo = grammyContext.message.photo[0].file_id;
                if (typeof grammyContext.message.caption !== 'undefined') {
                    text = grammyContext.message.caption;
                }
            } else if (typeof grammyContext.message.video !== 'undefined') {
                video = grammyContext.message.video.file_id;
                if (typeof grammyContext.message.caption !== 'undefined') {
                    text = grammyContext.message.caption;
                }
            } else if (typeof grammyContext.message.text !== 'undefined') {
                text = grammyContext.message.text;
            }
        }

        return new TelegramContext(
            grammyContext.me.id.toString(),
            tid,
            text,
            photo,
            video,
        );
    }
}
