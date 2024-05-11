"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopRootRouter = void 0;
class ShopRootRouter {
    constructor(adminWorkflowRouter, checkoutWorkflowRouter, homeWorkflowRouter, informationWorkflowRouter, productWorkflowRouter) {
        this.adminWorkflowRouter = adminWorkflowRouter;
        this.checkoutWorkflowRouter = checkoutWorkflowRouter;
        this.homeWorkflowRouter = homeWorkflowRouter;
        this.informationWorkflowRouter = informationWorkflowRouter;
        this.productWorkflowRouter = productWorkflowRouter;
    }
    async route(requestContext) {
        if (await this.adminWorkflowRouter.route(requestContext)) {
            return true;
        }
        else if (await this.checkoutWorkflowRouter.route(requestContext)) {
            return true;
        }
        else if (await this.homeWorkflowRouter.route(requestContext)) {
            return true;
        }
        else if (await this.informationWorkflowRouter.route(requestContext)) {
            return true;
        }
        else if (await this.productWorkflowRouter.route(requestContext)) {
            return true;
        }
        else {
            return false;
        }
    }
    async internalError(requestContext) { }
}
exports.ShopRootRouter = ShopRootRouter;
//# sourceMappingURL=root-router.js.map