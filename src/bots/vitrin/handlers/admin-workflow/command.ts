import { Injectable } from '@nestjs/common';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VitrinAdminWorkflowShopCommandExecuter } from './command-executers/shop';
import { AcommandParser } from 'src/infrastructures/parsers/acommand-parser';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';

@Injectable()
export class VitrinAdminWorkflowCommandHandler {
    private frontend: HydratedFrontend;
    private shopCommandExecuter: VitrinAdminWorkflowShopCommandExecuter;
    private acommandParser: AcommandParser;

    public constructor(
        frontend: HydratedFrontend,
        shopCommandExecuter: VitrinAdminWorkflowShopCommandExecuter,
        acommandParser: AcommandParser,
    ) {
        this.frontend = frontend;
        this.shopCommandExecuter = shopCommandExecuter;
        this.acommandParser = acommandParser;
    }

    public async handle(
        requestContext: RequestContext<Visitor>,
    ): Promise<void> {
        const tokens = this.acommandParser.parse(
            requestContext.telegramContext.text,
        );
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'shop') {
            await this.shopCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else {
            await this.error(requestContext);
        }
    }

    private async error(
        requestContext: RequestContext<Visitor>,
    ): Promise<never> {
        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'admin-workflow/command',
            { context: { scenario: 'error' } },
        );
        throw new ExpectedError();
    }
}
