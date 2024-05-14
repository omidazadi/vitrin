import { readFile } from 'fs/promises';
import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { Customer } from '../../../database/models/customer';

@Injectable()
export class ShopAdminWorkflowRouter {
    /*
    private uiPath: string;
    private commandHandler: ShopAdminWorkflowCommandHandler;
    private navigateOutHandler: ShopAdminWorkflowNavigateOutHandler;
    private buttonTexts: any;

    public constructor(
        @Inject('UI_PATH') uiPath: string,
        commandHandler: ShopAdminWorkflowCommandHandler,
        navigateOutHandler: ShopAdminWorkflowNavigateOutHandler,
    ) {
        this.uiPath = uiPath;
        this.commandHandler = commandHandler;
        this.navigateOutHandler = navigateOutHandler;
    }*/

    public async route(
        requestContext: RequestContext<Customer>,
    ): Promise<boolean> {
        return false;
    }

    /*
    public async configure(): Promise<void> {
        this.buttonTexts = JSON.parse(
            (
                await readFile(`${this.uiPath}/button-texts.json`, 'utf8')
            ).toString(),
        );
    }*/
}
