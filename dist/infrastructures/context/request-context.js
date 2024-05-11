"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestContext = void 0;
class RequestContext {
    constructor(telegramContext, user, poolClient) {
        this.telegramContext = telegramContext;
        this.user = user;
        this.poolClient = poolClient;
    }
}
exports.RequestContext = RequestContext;
//# sourceMappingURL=request-context.js.map