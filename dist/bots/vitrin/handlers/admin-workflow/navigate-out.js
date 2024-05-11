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
exports.VitrinAdminWorkflowNavigateOutHandler = void 0;
const common_1 = require("@nestjs/common");
const grammy_1 = require("grammy");
const class_transformer_1 = require("class-transformer");
const hydrated_frontend_1 = require("../../../../infrastructures/frontend/hydrated-frontend");
const visitor_repository_1 = require("../../../../database/repositories/visitor-repository");
const vitrin_config_1 = require("../../configs/vitrin-config");
let VitrinAdminWorkflowNavigateOutHandler = class VitrinAdminWorkflowNavigateOutHandler {
    constructor(frontend, visitorRepository, grammyBot, vitrinConfig) {
        this.frontend = frontend;
        this.visitorRepository = visitorRepository;
        this.grammyBot = grammyBot;
        this.vitrinConfig = vitrinConfig;
    }
    async handle(requestContext) {
        const ownerUsername = (await this.grammyBot.api.getChat(parseInt(this.vitrinConfig.owner))).username;
        const visitor = (0, class_transformer_1.instanceToInstance)(requestContext.user);
        visitor.data = { state: 'home' };
        await this.visitorRepository.updateVisitor(visitor, requestContext.poolClient);
        await this.frontend.sendActionMessage(requestContext.user.tid, 'admin-workflow/navigate-out', { context: { owner: ownerUsername } });
    }
};
exports.VitrinAdminWorkflowNavigateOutHandler = VitrinAdminWorkflowNavigateOutHandler;
exports.VitrinAdminWorkflowNavigateOutHandler = VitrinAdminWorkflowNavigateOutHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hydrated_frontend_1.HydratedFrontend,
        visitor_repository_1.VisitorRepository,
        grammy_1.Bot,
        vitrin_config_1.VitrinConfig])
], VitrinAdminWorkflowNavigateOutHandler);
//# sourceMappingURL=navigate-out.js.map