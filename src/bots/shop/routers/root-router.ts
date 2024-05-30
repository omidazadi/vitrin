import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopAdminWorkflowRouter } from './admin-workflow-router';
import { ShopCheckoutWorkflowRouter } from './checkout-workflow-router';
import { ShopHomeWorkflowRouter } from './home-workflow-router';
import { ShopInformationWorkflowRouter } from './information-workflow-router';
import { ShopProductWorkflowRouter } from './product-workflow-router';
import { ShopCommandRouter } from './command-router';
import { ShopCustomer } from '../user-builder';

@Injectable()
export class ShopRootRouter {
    private commandRouter: ShopCommandRouter;
    private adminWorkflowRouter: ShopAdminWorkflowRouter;
    private checkoutWorkflowRouter: ShopCheckoutWorkflowRouter;
    private homeWorkflowRouter: ShopHomeWorkflowRouter;
    private informationWorkflowRouter: ShopInformationWorkflowRouter;
    private productWorkflowRouter: ShopProductWorkflowRouter;

    public constructor(
        commandRouter: ShopCommandRouter,
        adminWorkflowRouter: ShopAdminWorkflowRouter,
        checkoutWorkflowRouter: ShopCheckoutWorkflowRouter,
        homeWorkflowRouter: ShopHomeWorkflowRouter,
        informationWorkflowRouter: ShopInformationWorkflowRouter,
        productWorkflowRouter: ShopProductWorkflowRouter,
    ) {
        this.commandRouter = commandRouter;
        this.adminWorkflowRouter = adminWorkflowRouter;
        this.checkoutWorkflowRouter = checkoutWorkflowRouter;
        this.homeWorkflowRouter = homeWorkflowRouter;
        this.informationWorkflowRouter = informationWorkflowRouter;
        this.productWorkflowRouter = productWorkflowRouter;
    }

    public async route(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<boolean> {
        if (await this.commandRouter.route(requestContext)) {
            return true;
        } else if (await this.adminWorkflowRouter.route(requestContext)) {
            return true;
        } else if (await this.checkoutWorkflowRouter.route(requestContext)) {
            return true;
        } else if (await this.homeWorkflowRouter.route(requestContext)) {
            return true;
        } else if (await this.informationWorkflowRouter.route(requestContext)) {
            return true;
        } else if (await this.productWorkflowRouter.route(requestContext)) {
            return true;
        } else {
            return false;
        }
    }
}
