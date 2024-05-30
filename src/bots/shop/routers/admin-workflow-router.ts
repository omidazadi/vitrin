import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopAdminWorkflowCommandHandler } from '../handlers/admin-workflow/command';
import { ShopAdminWorkflowNavigateOutHandler } from '../handlers/admin-workflow/navigate-out';
import { ShopCustomer } from '../user-builder';

@Injectable()
export class ShopAdminWorkflowRouter {
    private commandHandler: ShopAdminWorkflowCommandHandler;
    private navigateOutHandler: ShopAdminWorkflowNavigateOutHandler;
    private buttonTexts: any;

    public constructor(
        commandHandler: ShopAdminWorkflowCommandHandler,
        navigateOutHandler: ShopAdminWorkflowNavigateOutHandler,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.commandHandler = commandHandler;
        this.navigateOutHandler = navigateOutHandler;
        this.buttonTexts = buttonTexts;
    }

    public async route(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<boolean> {
        if (requestContext.user.customer.data.state === 'admin-cli') {
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
