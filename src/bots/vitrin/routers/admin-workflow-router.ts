import { readFile } from 'fs/promises';
import { Inject, Injectable } from '@nestjs/common';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { VitrinAdminWorkflowCommandHandler } from '../handlers/admin-workflow/command';
import { VitrinAdminWorkflowNavigateOutHandler } from '../handlers/admin-workflow/navigate-out';

@Injectable()
export class VitrinAdminWorkflowRouter {
    private commandHandler: VitrinAdminWorkflowCommandHandler;
    private navigateOutHandler: VitrinAdminWorkflowNavigateOutHandler;
    private buttonTexts: any;

    public constructor(
        commandHandler: VitrinAdminWorkflowCommandHandler,
        navigateOutHandler: VitrinAdminWorkflowNavigateOutHandler,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.commandHandler = commandHandler;
        this.navigateOutHandler = navigateOutHandler;
        this.buttonTexts = buttonTexts;
    }

    public async route(
        requestContext: RequestContext<Visitor>,
    ): Promise<boolean> {
        if (requestContext.user.data.state === 'admin-cli') {
            if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.admin_cli.back
            ) {
                await this.navigateOutHandler.handle(requestContext);
                return true;
            } else {
                await this.commandHandler.handle(requestContext);
                return true;
            }
        } else {
            return false;
        }
    }
}
