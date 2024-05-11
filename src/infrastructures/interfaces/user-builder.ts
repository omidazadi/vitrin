import { PoolClient } from 'pg';
import { TelegramContext } from '../context/telegram-context';

export interface UserBuilderInterface<T> {
    buildUser(
        telegramContext: TelegramContext,
        poolClient: PoolClient,
    ): Promise<T>;
}
