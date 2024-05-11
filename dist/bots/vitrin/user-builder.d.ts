import { PoolClient } from 'pg';
import { Visitor } from 'src/database/models/visitor';
import { VisitorRepository } from 'src/database/repositories/visitor-repository';
import { TelegramContext } from 'src/infrastructures/context/telegram-context';
import { UserBuilderInterface } from 'src/infrastructures/interfaces/user-builder';
export declare class VitrinUserBuilder implements UserBuilderInterface<Visitor> {
    private visitorRepository;
    constructor(visitorRepository: VisitorRepository);
    buildUser(telegramContext: TelegramContext, poolClient: PoolClient): Promise<Visitor>;
}
