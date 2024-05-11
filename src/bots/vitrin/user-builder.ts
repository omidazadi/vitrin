import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Visitor } from 'src/database/models/visitor';
import { VisitorRepository } from 'src/database/repositories/visitor-repository';
import { TelegramContext } from 'src/infrastructures/context/telegram-context';
import { UserBuilderInterface } from 'src/infrastructures/interfaces/user-builder';

@Injectable()
export class VitrinUserBuilder implements UserBuilderInterface<Visitor> {
    private visitorRepository: VisitorRepository;

    public constructor(visitorRepository: VisitorRepository) {
        this.visitorRepository = visitorRepository;
    }

    public async buildUser(
        telegramContext: TelegramContext,
        poolClient: PoolClient,
    ): Promise<Visitor> {
        let visitor = await this.visitorRepository.getVisitorByTidLocking(
            telegramContext.tid,
            poolClient,
        );
        if (visitor !== null) {
            return visitor;
        } else {
            return await this.visitorRepository.createVisitor(
                telegramContext.tid,
                { state: 'home' },
                poolClient,
            );
        }
    }
}
