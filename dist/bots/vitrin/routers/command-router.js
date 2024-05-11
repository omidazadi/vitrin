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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VitrinCommandRouter = void 0;
const promises_1 = require("fs/promises");
const common_1 = require("@nestjs/common");
const jump_to_home_1 = require("../handlers/home-workflow/jump-to-home");
const navigate_in_1 = require("../handlers/admin-workflow/navigate-in");
let VitrinCommandRouter = class VitrinCommandRouter {
    constructor(uiPath, homeWorkflowjumpToHomeHandler, adminWorkflowNavigateInHandler) {
        this.uiPath = uiPath;
        this.homeWorkflowjumpToHomeHandler = homeWorkflowjumpToHomeHandler;
        this.adminWorkflowNavigateInHandler = adminWorkflowNavigateInHandler;
    }
    async configure() {
        this.buttonTexts = JSON.parse((await (0, promises_1.readFile)(`${this.uiPath}/button-texts.json`, 'utf8')).toString());
    }
    async route(requestContext) {
        if (requestContext.telegramContext.text ===
            this.buttonTexts.command.start) {
            await this.homeWorkflowjumpToHomeHandler.handle(requestContext);
            return true;
        }
        else if (requestContext.telegramContext.text ===
            this.buttonTexts.command.admin_cli) {
            await this.adminWorkflowNavigateInHandler.handle(requestContext);
            return true;
        }
        else {
            return false;
        }
    }
};
exports.VitrinCommandRouter = VitrinCommandRouter;
exports.VitrinCommandRouter = VitrinCommandRouter = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('UI_PATH')),
    __metadata("design:paramtypes", [String, jump_to_home_1.VitrinHomeWorkflowJumpToHomeHandler,
        navigate_in_1.VitrinAdminWorkflowNavigateInHandler])
], VitrinCommandRouter);
//# sourceMappingURL=command-router.js.map