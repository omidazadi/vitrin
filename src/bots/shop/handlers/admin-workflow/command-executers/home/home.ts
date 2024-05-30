import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopAdminWorkflowHomeFaqCommandExecuter } from './faq';
import { ShopAdminWorkflowHomeAboutCommandExecuter } from './about';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { ShopAdminWorkflowHomeMainCommandExecuter } from './main';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';

@Injectable()
export class ShopAdminWorkflowHomeCommandExecuter {
    private frontend: HydratedFrontend;
    private faqCommandExecuter: ShopAdminWorkflowHomeFaqCommandExecuter;
    private aboutCommandExecuter: ShopAdminWorkflowHomeAboutCommandExecuter;
    private mainCommandExecuter: ShopAdminWorkflowHomeMainCommandExecuter;

    public constructor(
        frontend: HydratedFrontend,
        faqCommandExecuter: ShopAdminWorkflowHomeFaqCommandExecuter,
        aboutCommandExecuter: ShopAdminWorkflowHomeAboutCommandExecuter,
        mainCommandExecuter: ShopAdminWorkflowHomeMainCommandExecuter,
    ) {
        this.frontend = frontend;
        this.faqCommandExecuter = faqCommandExecuter;
        this.aboutCommandExecuter = aboutCommandExecuter;
        this.mainCommandExecuter = mainCommandExecuter;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'faq') {
            await this.faqCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'about') {
            await this.aboutCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'main') {
            await this.mainCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else {
            await this.error(requestContext);
        }
    }

    private async error(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<never> {
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            { context: { scenario: 'error' } },
        );
        throw new ExpectedError();
    }
}
