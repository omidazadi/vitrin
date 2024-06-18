import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { ShopAdminWorkflowHomeCommandExecuter } from './command-executers/home/home';
import { AcommandParser } from 'src/infrastructures/parsers/acommand-parser';
import { ShopAdminWorkflowSectionCommandExecuter } from './command-executers/section/section';
import { ShopAdminWorkflowMaintenanceCommandExecuter } from './command-executers/maintenance';
import { ShopAdminWorkflowTagCommandExecuter } from './command-executers/tag';
import { ShopCustomer } from '../../user-builder';
import { ShopAdminWorkflowProductCommandExecuter } from './command-executers/product/product';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';
import { ShopAdminWorkflowReferralPartnerCommandExecuter } from './command-executers/referral-partner';
import { ShopAdminWorkflowShopCommandExecuter } from './command-executers/shop/shop';
import { ShopAdminWorkflowPurchaseCommandExecuter } from './command-executers/purchase';

@Injectable()
export class ShopAdminWorkflowCommandHandler {
    private frontend: HydratedFrontend;
    private homeCommandExecuter: ShopAdminWorkflowHomeCommandExecuter;
    private maintenanceCommandExecuter: ShopAdminWorkflowMaintenanceCommandExecuter;
    private referralPartnerCommandExecuter: ShopAdminWorkflowReferralPartnerCommandExecuter;
    private shopCommandExecuter: ShopAdminWorkflowShopCommandExecuter;
    private purchaseCommandExecuter: ShopAdminWorkflowPurchaseCommandExecuter;
    private sectionCommandExecuter: ShopAdminWorkflowSectionCommandExecuter;
    private tagCommandExecuter: ShopAdminWorkflowTagCommandExecuter;
    private productCommandExecuter: ShopAdminWorkflowProductCommandExecuter;
    private acommandParser: AcommandParser;

    public constructor(
        frontend: HydratedFrontend,
        homeCommandExecuter: ShopAdminWorkflowHomeCommandExecuter,
        maintenanceCommandExecuter: ShopAdminWorkflowMaintenanceCommandExecuter,
        referralPartnerCommandExecuter: ShopAdminWorkflowReferralPartnerCommandExecuter,
        shopCommandExecuter: ShopAdminWorkflowShopCommandExecuter,
        purchaseCommandExecuter: ShopAdminWorkflowPurchaseCommandExecuter,
        sectionCommandExecuter: ShopAdminWorkflowSectionCommandExecuter,
        tagCommandExecuter: ShopAdminWorkflowTagCommandExecuter,
        productCommandExecuter: ShopAdminWorkflowProductCommandExecuter,
        acommandParser: AcommandParser,
    ) {
        this.frontend = frontend;
        this.homeCommandExecuter = homeCommandExecuter;
        this.maintenanceCommandExecuter = maintenanceCommandExecuter;
        this.referralPartnerCommandExecuter = referralPartnerCommandExecuter;
        this.shopCommandExecuter = shopCommandExecuter;
        this.purchaseCommandExecuter = purchaseCommandExecuter;
        this.sectionCommandExecuter = sectionCommandExecuter;
        this.tagCommandExecuter = tagCommandExecuter;
        this.productCommandExecuter = productCommandExecuter;
        this.acommandParser = acommandParser;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<void> {
        const tokens = this.acommandParser.parse(
            requestContext.telegramContext.text,
        );
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'home') {
            await this.homeCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'maintenance') {
            await this.maintenanceCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'referral-partner') {
            await this.referralPartnerCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'shop') {
            await this.shopCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'purchase') {
            await this.purchaseCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'section') {
            await this.sectionCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'tag') {
            await this.tagCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'product') {
            await this.productCommandExecuter.handle(
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
