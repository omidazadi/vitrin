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
exports.VitrinUnknownErrorHandler = void 0;
const common_1 = require("@nestjs/common");
const hydrated_frontend_1 = require("../../../../infrastructures/frontend/hydrated-frontend");
let VitrinUnknownErrorHandler = class VitrinUnknownErrorHandler {
    constructor(frontend) {
        this.frontend = frontend;
    }
    async handle(requestContext) {
        await this.frontend.sendActionMessage(requestContext.user.tid, 'common/unknown-error');
    }
};
exports.VitrinUnknownErrorHandler = VitrinUnknownErrorHandler;
exports.VitrinUnknownErrorHandler = VitrinUnknownErrorHandler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [hydrated_frontend_1.HydratedFrontend])
], VitrinUnknownErrorHandler);
//# sourceMappingURL=unknown-error.js.map