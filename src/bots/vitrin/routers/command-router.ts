import { readFile } from 'fs/promises';
import { Inject, Injectable } from '@nestjs/common';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { VitrinHomeWorkflowJumpToHomeHandler } from '../handlers/home-workflow/jump-to-home';
import { VitrinAdminWorkflowNavigateInHandler } from '../handlers/admin-workflow/navigate-in';
import { TcommandParser } from 'src/infrastructures/parsers/tcommand-parser';

@Injectable()
export class VitrinCommandRouter {
    private homeWorkflowjumpToHomeHandler: VitrinHomeWorkflowJumpToHomeHandler;
    private adminWorkflowNavigateInHandler: VitrinAdminWorkflowNavigateInHandler;
    private tcommandParser: TcommandParser;
    private buttonTexts: any;

    public constructor(
        homeWorkflowjumpToHomeHandler: VitrinHomeWorkflowJumpToHomeHandler,
        adminWorkflowNavigateInHandler: VitrinAdminWorkflowNavigateInHandler,
        tcommandParser: TcommandParser,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.homeWorkflowjumpToHomeHandler = homeWorkflowjumpToHomeHandler;
        this.adminWorkflowNavigateInHandler = adminWorkflowNavigateInHandler;
        this.tcommandParser = tcommandParser;
        this.buttonTexts = buttonTexts;
    }

    public async route(
        requestContext: RequestContext<Visitor>,
    ): Promise<boolean> {
        if (requestContext.telegramContext.text?.startsWith('/start')) {
            await this.homeWorkflowjumpToHomeHandler.handle(
                requestContext,
                this.tcommandParser.parse(requestContext.telegramContext.text),
            );
            return true;
        } else if (
            requestContext.telegramContext.text ===
            this.buttonTexts.command.admin_cli
        ) {
            await this.adminWorkflowNavigateInHandler.handle(requestContext);
            return true;
        } else {
            return false;
        }
    }
}
