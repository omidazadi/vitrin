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
exports.VitrinAdminWorkflowRouter = void 0;
const promises_1 = require("fs/promises");
const common_1 = require("@nestjs/common");
const command_1 = require("../handlers/admin-workflow/command");
const navigate_out_1 = require("../handlers/admin-workflow/navigate-out");
let VitrinAdminWorkflowRouter = class VitrinAdminWorkflowRouter {
    constructor(uiPath, commandHandler, navigateOutHandler) {
        this.uiPath = uiPath;
        this.commandHandler = commandHandler;
        this.navigateOutHandler = navigateOutHandler;
    }
    async configure() {
        this.buttonTexts = JSON.parse((await (0, promises_1.readFile)(`${this.uiPath}/button-texts.json`, 'utf8')).toString());
    }
    async route(requestContext) {
        if (requestContext.user.data.state === 'admin-cli') {
            if (requestContext.telegramContext.text ===
                this.buttonTexts.state.admin_cli.back) {
                await this.navigateOutHandler.handle(requestContext);
                return true;
            }
            else {
                await this.commandHandler.handle(requestContext);
                return true;
            }
        }
        else {
            return false;
        }
    }
};
exports.VitrinAdminWorkflowRouter = VitrinAdminWorkflowRouter;
exports.VitrinAdminWorkflowRouter = VitrinAdminWorkflowRouter = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('UI_PATH')),
    __metadata("design:paramtypes", [String, command_1.VitrinAdminWorkflowCommandHandler,
        navigate_out_1.VitrinAdminWorkflowNavigateOutHandler])
], VitrinAdminWorkflowRouter);
//# sourceMappingURL=admin-workflow-router.js.map