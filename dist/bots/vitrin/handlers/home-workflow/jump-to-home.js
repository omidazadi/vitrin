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
exports.VitrinHomeWorkflowJumpToHomeHandler = void 0;
const common_1 = require("@nestjs/common");
const grammy_1 = require("grammy");
const class_transformer_1 = require("class-transformer");
const request_context_1 = require("../../../../infrastructures/context/request-context");
const hydrated_frontend_1 = require("../../../../infrastructures/frontend/hydrated-frontend");
const visitor_repository_1 = require("../../../../database/repositories/visitor-repository");
const vitrin_config_1 = require("../../configs/vitrin-config");
const allowed_media_1 = require("../../../../infrastructures/allowed-media");
let VitrinHomeWorkflowJumpToHomeHandler = class VitrinHomeWorkflowJumpToHomeHandler {
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
        await this.frontend.sendActionMessage(requestContext.user.tid, 'home-workflow/jump-to-home', { context: { owner: ownerUsername } });
    }
};
exports.VitrinHomeWorkflowJumpToHomeHandler = VitrinHomeWorkflowJumpToHomeHandler;
__decorate([
    (0, allowed_media_1.allowedMedia)({
        photo: 'prohibited',
        video: 'prohibited',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [request_context_1.RequestContext]),
    __metadata("design:returntype", Promise)
], VitrinHomeWorkflowJumpToHomeHandler.prototype, "handle", null);
exports.VitrinHomeWorkflowJumpToHomeHandler = VitrinHomeWorkflowJumpToHomeHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hydrated_frontend_1.HydratedFrontend,
        visitor_repository_1.VisitorRepository,
        grammy_1.Bot,
        vitrin_config_1.VitrinConfig])
], VitrinHomeWorkflowJumpToHomeHandler);
//# sourceMappingURL=jump-to-home.js.map