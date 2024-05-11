import { PoolClient } from 'pg';
import { TelegramContext } from './telegram-context';
export declare class RequestContext<T> {
    telegramContext: TelegramContext;
    user: T;
    poolClient: PoolClient;
    constructor(telegramContext: TelegramContext, user: T, poolClient: PoolClient);
}
