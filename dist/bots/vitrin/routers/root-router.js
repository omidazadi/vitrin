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
exports.VitrinRootRouter = void 0;
const common_1 = require("@nestjs/common");
const admin_workflow_router_1 = require("./admin-workflow-router");
const command_router_1 = require("./command-router");
let VitrinRootRouter = class VitrinRootRouter {
    constructor(commandRouter, adminWorkflowRouter) {
        this.commandRouter = commandRouter;
        this.adminWorkflowRouter = adminWorkflowRouter;
    }
    async route(requestContext) {
        if (await this.commandRouter.route(requestContext)) {
            return true;
        }
        else if (await this.adminWorkflowRouter.route(requestContext)) {
            return true;
        }
        else {
            return false;
        }
    }
    async internalError(requestContext) { }
};
exports.VitrinRootRouter = VitrinRootRouter;
exports.VitrinRootRouter = VitrinRootRouter = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [command_router_1.VitrinCommandRouter,
        admin_workflow_router_1.VitrinAdminWorkflowRouter])
], VitrinRootRouter);
//# sourceMappingURL=root-router.js.map