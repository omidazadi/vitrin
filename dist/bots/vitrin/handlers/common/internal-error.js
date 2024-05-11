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
exports.VitrinInternalErrorHandler = void 0;
const common_1 = require("@nestjs/common");
const class_transformer_1 = require("class-transformer");
const hydrated_frontend_1 = require("../../../../infrastructures/frontend/hydrated-frontend");
const visitor_repository_1 = require("../../../../database/repositories/visitor-repository");
let VitrinInternalErrorHandler = class VitrinInternalErrorHandler {
    constructor(frontend, visitorRepository) {
        this.frontend = frontend;
        this.visitorRepository = visitorRepository;
    }
    async handle(requestContext) {
        const visitor = (0, class_transformer_1.instanceToInstance)(requestContext.user);
        visitor.data = { state: 'home' };
        await this.visitorRepository.updateVisitor(visitor, requestContext.poolClient);
        await this.frontend.sendActionMessage(requestContext.user.tid, 'common/internal-error');
    }
};
exports.VitrinInternalErrorHandler = VitrinInternalErrorHandler;
exports.VitrinInternalErrorHandler = VitrinInternalErrorHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hydrated_frontend_1.HydratedFrontend,
        visitor_repository_1.VisitorRepository])
], VitrinInternalErrorHandler);
//# sourceMappingURL=internal-error.js.map