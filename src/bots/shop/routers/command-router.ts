import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopCommandWorkflowStartHandler } from '../handlers/command-workflow/start';
import { TcommandParser } from 'src/infrastructures/parsers/tcommand-parser';
import { ShopAdminWorkflowNavigateInHandler } from '../handlers/admin-workflow/navigate-in';
import { ShopCustomer } from '../user-builder';
import { ShopCommandWorkflowSetReferralHandler } from '../handlers/command-workflow/set-referral';
import { ShopCartWorkflowNavigateInHandler } from '../handlers/cart-workflow/navigate-in';

@Injectable()
export class ShopCommandRouter {
    private startHandler: ShopCommandWorkflowStartHandler;
    private setReferralHandler: ShopCommandWorkflowSetReferralHandler;
    private cartWorkflowNavigateInHandler: ShopCartWorkflowNavigateInHandler;
    private adminWorkflowNavigateInHandler: ShopAdminWorkflowNavigateInHandler;
    private tcommandParser: TcommandParser;
    private buttonTexts: any;

    public constructor(
        startHandler: ShopCommandWorkflowStartHandler,
        setReferralHandler: ShopCommandWorkflowSetReferralHandler,
        cartWorkflowNavigateInHandler: ShopCartWorkflowNavigateInHandler,
        adminWorkflowNavigateInHandler: ShopAdminWorkflowNavigateInHandler,
        tcommandParser: TcommandParser,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.startHandler = startHandler;
        this.setReferralHandler = setReferralHandler;
        this.cartWorkflowNavigateInHandler = cartWorkflowNavigateInHandler;
        this.adminWorkflowNavigateInHandler = adminWorkflowNavigateInHandler;
        this.tcommandParser = tcommandParser;
        this.buttonTexts = buttonTexts;
    }

    public async route(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<boolean> {
        if (requestContext.telegramContext.text?.startsWith('/start')) {
            const tcommandArgs = this.tcommandParser.parse(
                requestContext.telegramContext.text,
            );

            if (tcommandArgs === null) {
                await this.startHandler.handle(requestContext, tcommandArgs);
                return true;
            } else if (tcommandArgs.opcode === 0) {
                await this.setReferralHandler.handle(
                    requestContext,
                    tcommandArgs,
                );
                return true;
            } else if (tcommandArgs.opcode === 1) {
                await this.cartWorkflowNavigateInHandler.handle(requestContext);
                return true;
            } else {
                return false;
            }
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
