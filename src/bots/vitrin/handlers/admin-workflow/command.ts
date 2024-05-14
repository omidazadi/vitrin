import { Injectable } from '@nestjs/common';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VitrinAdminWorkflowShopCommandExecuter } from './command-executers/shop';

@Injectable()
export class VitrinAdminWorkflowCommandHandler {
    private frontend: HydratedFrontend;
    private shopCommandExecuter: VitrinAdminWorkflowShopCommandExecuter;

    public constructor(
        frontend: HydratedFrontend,
        shopCommandExecuter: VitrinAdminWorkflowShopCommandExecuter,
    ) {
        this.frontend = frontend;
        this.shopCommandExecuter = shopCommandExecuter;
    }

    public async handle(
        requestContext: RequestContext<Visitor>,
    ): Promise<void> {
        const tokens = this.parseCommand(requestContext.telegramContext.text);
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

    private async error(requestContext: RequestContext<Visitor>) {
        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'admin-workflow/command',
            { context: { scenario: 'error' } },
        );
    }

    private parseCommand(command: string | null): Array<string> {
        if (command === null) {
            return [];
        }

        let result: Array<string> = [];
        let current: string | null = null;
        let isMultiLine = false;
        const multiLineBegin = '{';
        const multiLineEnd = '}';

        for (let char of command) {
            if (current === null) {
                if (/\s/.test(char)) {
                    continue;
                } else {
                    if (char === multiLineBegin) {
                        current = '';
                        isMultiLine = true;
                    } else {
                        current = char;
                    }
                }
            } else if (!/\s/.test(char)) {
                if (isMultiLine && char === multiLineEnd) {
                    result.push(current.trim());
                    current = null;
                    isMultiLine = false;
                } else {
                    current += char;
                }
            } else if (!isMultiLine) {
                result.push(current.trim());
                current = null;
                isMultiLine = false;
            } else {
                current += char;
            }
        }

        if (current !== null && !isMultiLine) {
            result.push(current.trim());
        }

        return result;
    }
}
