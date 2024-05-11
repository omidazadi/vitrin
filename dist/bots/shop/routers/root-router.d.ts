import { RequestContext } from 'src/infrastructures/context/request-context';
import { Customer } from '../../../database/models/customer';
import { ShopAdminWorkflowRouter } from './admin-workflow-router';
import { ShopCheckoutWorkflowRouter } from './checkout-workflow-router';
import { ShopHomeWorkflowRouter } from './home-workflow-router';
import { ShopInformationWorkflowRouter } from './information-workflow-router';
import { ShopProductWorkflowRouter } from './product-workflow-router';
export declare class ShopRootRouter {
    private adminWorkflowRouter;
    private checkoutWorkflowRouter;
    private homeWorkflowRouter;
    private informationWorkflowRouter;
    private productWorkflowRouter;
    constructor(adminWorkflowRouter: ShopAdminWorkflowRouter, checkoutWorkflowRouter: ShopCheckoutWorkflowRouter, homeWorkflowRouter: ShopHomeWorkflowRouter, informationWorkflowRouter: ShopInformationWorkflowRouter, productWorkflowRouter: ShopProductWorkflowRouter);
    route(requestContext: RequestContext<Customer>): Promise<boolean>;
    internalError(requestContext: RequestContext<Customer>): Promise<void>;
}
