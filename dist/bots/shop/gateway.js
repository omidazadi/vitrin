"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShopGateway = void 0;
class ShopGateway {
    constructor(contextManager, databaseManager, router, logger) {
        this.contextManager = contextManager;
        this.databaseManager = databaseManager;
        this.router = router;
        this.logger = logger;
    }
    async initialize() { }
    async recieve(grammyContext) {
        const requestContext = await this.contextManager.buildRequestContext(grammyContext);
        try {
            await this.router.route(requestContext);
            await this.databaseManager.commitTransaction(requestContext.poolClient);
        }
        catch (e) {
            await this.logger.warn(e.toString());
            await this.databaseManager.rollbackTransaction(requestContext.poolClient);
            requestContext.poolClient =
                await this.databaseManager.createTransaction();
            await this.router.internalError(requestContext);
            await this.databaseManager.commitTransaction(requestContext.poolClient);
        }
    }
}
exports.ShopGateway = ShopGateway;
//# sourceMappingURL=gateway.js.map