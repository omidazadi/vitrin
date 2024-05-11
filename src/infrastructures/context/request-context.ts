import { PoolClient } from 'pg';
import { TelegramContext } from './telegram-context';

export class RequestContext<T> {
    public telegramContext: TelegramContext;
    public user: T;
    public poolClient: PoolClient;

    public constructor(
        telegramContext: TelegramContext,
        user: T,
        poolClient: PoolClient,
    ) {
        this.telegramContext = telegramContext;
        this.user = user;
        this.poolClient = poolClient;
    }
}
