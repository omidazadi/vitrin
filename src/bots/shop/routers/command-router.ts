import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopCommandWorkflowStartHandler } from '../handlers/command-workflow/start';
import { TcommandParser } from 'src/infrastructures/parsers/tcommand-parser';
import { ShopCommandWorkflowToCliHandler } from '../handlers/command-workflow/to-cli';
import { ShopCustomer } from '../user-builder';
import { ShopCommandWorkflowSetReferralHandler } from '../handlers/command-workflow/set-referral';
import { ShopCommandWorkflowToCartHandler } from '../handlers/command-workflow/to-cart';

@Injectable()
export class ShopCommandRouter {
    private startHandler: ShopCommandWorkflowStartHandler;
    private setReferralHandler: ShopCommandWorkflowSetReferralHandler;
    private toCartHandler: ShopCommandWorkflowToCartHandler;
    private toCliHandler: ShopCommandWorkflowToCliHandler;
    private tcommandParser: TcommandParser;
    private buttonTexts: any;

    public constructor(
        startHandler: ShopCommandWorkflowStartHandler,
        setReferralHandler: ShopCommandWorkflowSetReferralHandler,
        toCartHandler: ShopCommandWorkflowToCartHandler,
        toCliHandler: ShopCommandWorkflowToCliHandler,
        tcommandParser: TcommandParser,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.startHandler = startHandler;
        this.setReferralHandler = setReferralHandler;
        this.toCartHandler = toCartHandler;
        this.toCliHandler = toCliHandler;
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
                await this.toCartHandler.handle(requestContext, tcommandArgs);
                return true;
            } else {
                return false;
            }
        } else if (
            requestContext.telegramContext.text ===
            this.buttonTexts.command.admin_cli
        ) {
            await this.toCliHandler.handle(requestContext);
            return true;
        } else {
            return false;
        }
    }
}
