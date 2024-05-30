import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopProductWorkflowStartHandler } from '../handlers/product-workflow/start';
import { ShopProductWorkflowSetReferralHandler } from '../handlers/product-workflow/set-referral';
import { TcommandParser } from 'src/infrastructures/parsers/tcommand-parser';
import { ShopAdminWorkflowNavigateInHandler } from '../handlers/admin-workflow/navigate-in';
import { ShopCustomer } from '../user-builder';

@Injectable()
export class ShopCommandRouter {
    private productWorkflowStartHandler: ShopProductWorkflowStartHandler;
    private productWorkflowSetReferralHandler: ShopProductWorkflowSetReferralHandler;
    private adminWorkflowNavigateInHandler: ShopAdminWorkflowNavigateInHandler;
    private tcommandParser: TcommandParser;
    private buttonTexts: any;

    public constructor(
        productWorkflowStartHandler: ShopProductWorkflowStartHandler,
        productWorkflowSetReferralHandler: ShopProductWorkflowSetReferralHandler,
        adminWorkflowNavigateInHandler: ShopAdminWorkflowNavigateInHandler,
        tcommandParser: TcommandParser,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.productWorkflowStartHandler = productWorkflowStartHandler;
        this.productWorkflowSetReferralHandler =
            productWorkflowSetReferralHandler;
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
                await this.productWorkflowStartHandler.handle(
                    requestContext,
                    tcommandArgs,
                );
                return true;
            } else if (tcommandArgs.opcode === 0) {
                await this.productWorkflowSetReferralHandler.handle(
                    requestContext,
                    tcommandArgs,
                );
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
