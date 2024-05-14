import { readFile } from 'fs/promises';
import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { Customer } from '../../../database/models/customer';
import { TcommandParser } from 'src/infrastructures/tcommand-parser';
import { ShopHomeWorkflowJumpToHomeHandler } from '../handlers/home-workflow/jump-to-home';
import { ShopHomeWorkflowSetReferralHandler } from '../handlers/home-workflow/set-referral';

@Injectable()
export class ShopCommandRouter {
    private homeWorkflowJumpToHomeHandler: ShopHomeWorkflowJumpToHomeHandler;
    private homeWorkflowSetReferralHandler: ShopHomeWorkflowSetReferralHandler;
    private tcommandParser: TcommandParser;
    private buttonTexts: any;

    public constructor(
        homeWorkflowJumpToHomeHandler: ShopHomeWorkflowJumpToHomeHandler,
        homeWorkflowSetReferralHandler: ShopHomeWorkflowSetReferralHandler,
        tcommandParser: TcommandParser,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.homeWorkflowJumpToHomeHandler = homeWorkflowJumpToHomeHandler;
        this.homeWorkflowSetReferralHandler = homeWorkflowSetReferralHandler;
        this.tcommandParser = tcommandParser;
        this.buttonTexts = buttonTexts;
    }

    public async route(
        requestContext: RequestContext<Customer>,
    ): Promise<boolean> {
        if (requestContext.telegramContext.text?.startsWith('/start')) {
            const tcommandArgs = this.tcommandParser.parse(
                requestContext.telegramContext.text,
            );

            if (tcommandArgs === null) {
                await this.homeWorkflowJumpToHomeHandler.handle(
                    requestContext,
                    tcommandArgs,
                );
                return true;
            } else if (tcommandArgs.opcode === 0) {
                await this.homeWorkflowSetReferralHandler.handle(
                    requestContext,
                    tcommandArgs,
                );
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}
