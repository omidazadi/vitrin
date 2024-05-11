"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VitrinGateway = void 0;
const common_1 = require("@nestjs/common");
const context_manager_1 = require("../../infrastructures/context/context-manager");
const database_manager_1 = require("../../infrastructures/database-manager");
const logger_1 = require("../../infrastructures/logger");
const root_router_1 = require("./routers/root-router");
const internal_error_1 = require("./handlers/common/internal-error");
const unknown_error_1 = require("./handlers/common/unknown-error");
const unsupported_media_error_1 = require("./handlers/common/unsupported-media-error");
const media_now_allowed_error_1 = require("../../infrastructures/errors/media-now-allowed-error");
let VitrinGateway = class VitrinGateway {
    constructor(contextManager, databaseManager, router, logger, internalErrorHandler, unknownErrorHandler, unsupportedMediaErrorHandler) {
        this.contextManager = contextManager;
        this.databaseManager = databaseManager;
        this.router = router;
        this.logger = logger;
        this.internalErrorHandler = internalErrorHandler;
        this.unknownErrorHandler = unknownErrorHandler;
        this.unsupportedMediaErrorHandler = unsupportedMediaErrorHandler;
    }
    async initialize() { }
    async recieve(grammyContext) {
        const requestContext = await this.contextManager.buildRequestContext(grammyContext);
        try {
            console.log(requestContext.telegramContext);
            if (requestContext.telegramContext.text === null &&
                requestContext.telegramContext.photo === null &&
                requestContext.telegramContext.video === null) {
                await this.unsupportedMediaErrorHandler.handle(requestContext);
                await this.databaseManager.rollbackTransaction(requestContext.poolClient);
                return;
            }
            const isMatched = await this.router.route(requestContext);
            await this.databaseManager.commitTransaction(requestContext.poolClient);
            if (!isMatched) {
                await this.unknownErrorHandler.handle(requestContext);
                return;
            }
        }
        catch (e) {
            if (e instanceof media_now_allowed_error_1.MediaNotAllowedError) {
                await this.unknownErrorHandler.handle(requestContext);
                await this.databaseManager.rollbackTransaction(requestContext.poolClient);
                return;
            }
            await this.logger.warn(e.toString());
            await this.databaseManager.rollbackTransaction(requestContext.poolClient);
            requestContext.poolClient =
                await this.databaseManager.createTransaction();
            await this.internalErrorHandler.handle(requestContext);
            await this.databaseManager.commitTransaction(requestContext.poolClient);
        }
    }
};
exports.VitrinGateway = VitrinGateway;
exports.VitrinGateway = VitrinGateway = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [context_manager_1.ContextManager,
        database_manager_1.DatabaseManager,
        root_router_1.VitrinRootRouter,
        logger_1.Logger,
        internal_error_1.VitrinInternalErrorHandler,
        unknown_error_1.VitrinUnknownErrorHandler,
        unsupported_media_error_1.VitrinUnsupportedMediaErrorHandler])
], VitrinGateway);
//# sourceMappingURL=gateway.js.map