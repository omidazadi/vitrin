import { readFile } from 'fs/promises';
import { Inject, Injectable } from '@nestjs/common';
import { Visitor } from 'src/database/models/visitor';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { VitrinHomeWorkflowJumpToHomeHandler } from '../handlers/home-workflow/jump-to-home';

@Injectable()
export class VitrinHomeWorkflowRouter {
    private uiPath: string;
    private jumpToHomeHandler: VitrinHomeWorkflowJumpToHomeHandler;
    private buttonTexts: any;

    public constructor(
        @Inject('UI_PATH') uiPath: string,
        jumpToHomeHandler: VitrinHomeWorkflowJumpToHomeHandler,
    ) {
        this.uiPath = uiPath;
        this.jumpToHomeHandler = jumpToHomeHandler;
    }

    public async configure(): Promise<void> {
        this.buttonTexts = JSON.parse(
            (
                await readFile(`${this.uiPath}/button-texts.json`, 'utf8')
            ).toString(),
        );
    }

    public async route(
        requestContext: RequestContext<Visitor>,
    ): Promise<boolean> {
        if (
            requestContext.telegramContext.text ===
            this.buttonTexts.command.start
        ) {
            await this.jumpToHomeHandler.handle(requestContext);
            return true;
        } else {
            return false;
        }
    }
}
