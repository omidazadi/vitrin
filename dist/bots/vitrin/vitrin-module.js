"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VitrinModule = void 0;
const common_1 = require("@nestjs/common");
const grammy_1 = require("grammy");
const user_builder_1 = require("./user-builder");
const context_manager_1 = require("../../infrastructures/context/context-manager");
const root_router_1 = require("./routers/root-router");
const admin_workflow_router_1 = require("./routers/admin-workflow-router");
const command_1 = require("./handlers/admin-workflow/command");
const navigate_in_1 = require("./handlers/admin-workflow/navigate-in");
const navigate_out_1 = require("./handlers/admin-workflow/navigate-out");
const vitrin_config_1 = require("./configs/vitrin-config");
const database_module_1 = require("../../database/database-module");
const logger_1 = require("../../infrastructures/logger");
const dry_frontend_1 = require("../../infrastructures/frontend/dry-frontend");
const hydrated_frontend_1 = require("../../infrastructures/frontend/hydrated-frontend");
const logger_config_1 = require("../../infrastructures/configs/logger-config");
const class_validator_1 = require("class-validator");
const ux_constant_1 = require("../../infrastructures/constant/ux-constant");
const jump_to_home_1 = require("./handlers/home-workflow/jump-to-home");
const gateway_1 = require("./gateway");
const bot_runner_1 = require("../../infrastructures/bot-runner");
const command_router_1 = require("./routers/command-router");
const internal_error_1 = require("./handlers/common/internal-error");
const unknown_error_1 = require("./handlers/common/unknown-error");
const unsupported_media_error_1 = require("./handlers/common/unsupported-media-error");
let VitrinModule = class VitrinModule {
};
exports.VitrinModule = VitrinModule;
exports.VitrinModule = VitrinModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule],
        providers: [
            {
                provide: 'UI_PATH',
                useValue: 'src/bots/vitrin/views',
            },
            {
                provide: vitrin_config_1.VitrinConfig,
                useFactory: async function () {
                    const vitrinConfig = new vitrin_config_1.VitrinConfig();
                    const validationErrors = await (0, class_validator_1.validate)(vitrinConfig);
                    if (validationErrors.length > 0) {
                        throw new Error(validationErrors[0].toString());
                    }
                    return vitrinConfig;
                },
            },
            {
                provide: logger_config_1.LoggerConfig,
                useFactory: async function () {
                    const loggerConfig = new logger_config_1.LoggerConfig();
                    const validationErrors = await (0, class_validator_1.validate)(loggerConfig);
                    if (validationErrors.length > 0) {
                        throw new Error(validationErrors[0].toString());
                    }
                    return loggerConfig;
                },
            },
            ux_constant_1.UxConstant,
            {
                provide: grammy_1.Bot,
                useFactory: async function (vitrinConfig) {
                    const grammyBot = new grammy_1.Bot(vitrinConfig.botToken);
                    return grammyBot;
                },
                inject: [vitrin_config_1.VitrinConfig],
            },
            {
                provide: dry_frontend_1.DryFrontend,
                useFactory: async function (grammyBot, uiPath, uxConstant) {
                    const dryFrontend = new dry_frontend_1.DryFrontend(grammyBot, uiPath, uxConstant);
                    await dryFrontend.configure();
                    return dryFrontend;
                },
                inject: [grammy_1.Bot, 'UI_PATH', ux_constant_1.UxConstant],
            },
            hydrated_frontend_1.HydratedFrontend,
            {
                provide: logger_1.Logger,
                useFactory: async function (dryFrontend, grammyBot, loggerConfig) {
                    const logger = new logger_1.Logger(dryFrontend, grammyBot, loggerConfig);
                    await logger.configure();
                    return logger;
                },
                inject: [dry_frontend_1.DryFrontend, grammy_1.Bot, logger_config_1.LoggerConfig],
            },
            (context_manager_1.ContextManager),
            {
                provide: 'USER_BUILDER',
                useClass: user_builder_1.VitrinUserBuilder,
            },
            {
                provide: 'GATEWAY',
                useClass: gateway_1.VitrinGateway,
            },
            bot_runner_1.BotRunner,
            root_router_1.VitrinRootRouter,
            {
                provide: admin_workflow_router_1.VitrinAdminWorkflowRouter,
                useFactory: async function (uiPath, commandHandler, navigateOutHandler) {
                    const vitrinAdminWorkflowRouter = new admin_workflow_router_1.VitrinAdminWorkflowRouter(uiPath, commandHandler, navigateOutHandler);
                    await vitrinAdminWorkflowRouter.configure();
                    return vitrinAdminWorkflowRouter;
                },
                inject: [
                    'UI_PATH',
                    command_1.VitrinAdminWorkflowCommandHandler,
                    navigate_out_1.VitrinAdminWorkflowNavigateOutHandler,
                ],
            },
            {
                provide: command_router_1.VitrinCommandRouter,
                useFactory: async function (uiPath, homeWorkflowjumpToHomeHandler, adminWorkflowNavigateInHandler) {
                    const vitrinHomeWorkflowHandler = new command_router_1.VitrinCommandRouter(uiPath, homeWorkflowjumpToHomeHandler, adminWorkflowNavigateInHandler);
                    await vitrinHomeWorkflowHandler.configure();
                    return vitrinHomeWorkflowHandler;
                },
                inject: [
                    'UI_PATH',
                    jump_to_home_1.VitrinHomeWorkflowJumpToHomeHandler,
                    navigate_in_1.VitrinAdminWorkflowNavigateInHandler,
                ],
            },
            command_1.VitrinAdminWorkflowCommandHandler,
            navigate_in_1.VitrinAdminWorkflowNavigateInHandler,
            navigate_out_1.VitrinAdminWorkflowNavigateOutHandler,
            jump_to_home_1.VitrinHomeWorkflowJumpToHomeHandler,
            internal_error_1.VitrinInternalErrorHandler,
            unknown_error_1.VitrinUnknownErrorHandler,
            unsupported_media_error_1.VitrinUnsupportedMediaErrorHandler,
        ],
    })
], VitrinModule);
//# sourceMappingURL=vitrin-module.js.map