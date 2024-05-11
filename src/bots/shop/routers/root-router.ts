import { RequestContext } from 'src/infrastructures/context/request-context';
import { Customer } from '../../../database/models/customer';
import { ShopAdminWorkflowRouter } from './admin-workflow-router';
import { ShopCheckoutWorkflowRouter } from './checkout-workflow-router';
import { ShopHomeWorkflowRouter } from './home-workflow-router';
import { ShopInformationWorkflowRouter } from './information-workflow-router';
import { ShopProductWorkflowRouter } from './product-workflow-router';

export class ShopRootRouter {
    private adminWorkflowRouter: ShopAdminWorkflowRouter;
    private checkoutWorkflowRouter: ShopCheckoutWorkflowRouter;
    private homeWorkflowRouter: ShopHomeWorkflowRouter;
    private informationWorkflowRouter: ShopInformationWorkflowRouter;
    private productWorkflowRouter: ShopProductWorkflowRouter;

    public constructor(
        adminWorkflowRouter: ShopAdminWorkflowRouter,
        checkoutWorkflowRouter: ShopCheckoutWorkflowRouter,
        homeWorkflowRouter: ShopHomeWorkflowRouter,
        informationWorkflowRouter: ShopInformationWorkflowRouter,
        productWorkflowRouter: ShopProductWorkflowRouter,
    ) {
        this.adminWorkflowRouter = adminWorkflowRouter;
        this.checkoutWorkflowRouter = checkoutWorkflowRouter;
        this.homeWorkflowRouter = homeWorkflowRouter;
        this.informationWorkflowRouter = informationWorkflowRouter;
        this.productWorkflowRouter = productWorkflowRouter;
    }

    public async route(
        requestContext: RequestContext<Customer>,
    ): Promise<boolean> {
        if (await this.adminWorkflowRouter.route(requestContext)) {
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

    public async internalError(
        requestContext: RequestContext<Customer>,
    ): Promise<void> {}
}
