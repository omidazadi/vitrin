import { Module } from '@nestjs/common';
import { Bot as GrammyBot } from 'grammy';
import { VitrinUserBuilder } from './user-builder';
import { ContextManager } from 'src/infrastructures/context/context-manager';
import { Visitor } from 'src/database/models/visitor';
import { VitrinRootRouter } from './routers/root-router';
import { VitrinAdminWorkflowRouter } from './routers/admin-workflow-router';
import { VitrinAdminWorkflowCommandHandler } from './handlers/admin-workflow/command';
import { VitrinAdminWorkflowNavigateInHandler } from './handlers/admin-workflow/navigate-in';
import { VitrinAdminWorkflowNavigateOutHandler } from './handlers/admin-workflow/navigate-out';
import { VitrinConfig } from './configs/vitrin-config';
import { DatabaseModule } from 'src/database/database-module';
import { Logger } from 'src/infrastructures/logger';
import { DryFrontend } from 'src/infrastructures/frontend/dry-frontend';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { LoggerConfig } from 'src/infrastructures/configs/logger-config';
import { validate } from 'class-validator';
import { VitrinHomeWorkflowJumpToHomeHandler } from './handlers/home-workflow/jump-to-home';
import { VitrinGateway } from './gateway';
import { BotRunner } from 'src/infrastructures/bot-runner';
import { VitrinCommandRouter } from './routers/command-router';
import { VitrinInternalErrorHandler } from './handlers/common/internal-error';
import { VitrinUnknownErrorHandler } from './handlers/common/unknown-error';
import { VitrinUnsupportedMediaErrorHandler } from './handlers/common/unsupported-media-error';

@Module({
    imports: [DatabaseModule],
    providers: [
        {
            provide: 'UI_PATH',
            useValue: 'src/bots/vitrin/views',
        },
        {
            provide: VitrinConfig,
            useFactory: async function () {
                const vitrinConfig = new VitrinConfig();
                const validationErrors = await validate(vitrinConfig);
                if (validationErrors.length > 0) {
                    throw new Error(validationErrors[0].toString());
                }
                return vitrinConfig;
            },
        },
        {
            provide: LoggerConfig,
            useFactory: async function () {
                const loggerConfig = new LoggerConfig();
                const validationErrors = await validate(loggerConfig);
                if (validationErrors.length > 0) {
                    throw new Error(validationErrors[0].toString());
                }
                return loggerConfig;
            },
        },

        {
            provide: GrammyBot,
            useFactory: async function (vitrinConfig: VitrinConfig) {
                const grammyBot = new GrammyBot(vitrinConfig.botToken);
                return grammyBot;
            },
            inject: [VitrinConfig],
        },
        {
            provide: DryFrontend,
            useFactory: async function (grammyBot: GrammyBot, uiPath: string) {
                const dryFrontend = new DryFrontend(grammyBot, uiPath);
                await dryFrontend.configure();
                return dryFrontend;
            },
            inject: [GrammyBot, 'UI_PATH'],
        },
        HydratedFrontend,
        {
            provide: Logger,
            useFactory: async function (
                dryFrontend: DryFrontend,
                grammyBot: GrammyBot,
                loggerConfig: LoggerConfig,
            ) {
                const logger = new Logger(dryFrontend, grammyBot, loggerConfig);
                await logger.configure();
                return logger;
            },
            inject: [DryFrontend, GrammyBot, LoggerConfig],
        },
        ContextManager<Visitor>,
        {
            provide: 'USER_BUILDER',
            useClass: VitrinUserBuilder,
        },
        {
            provide: 'GATEWAY',
            useClass: VitrinGateway,
        },
        BotRunner,

        VitrinRootRouter,
        {
            provide: VitrinAdminWorkflowRouter,
            useFactory: async function (
                uiPath: string,
                commandHandler: VitrinAdminWorkflowCommandHandler,
                navigateOutHandler: VitrinAdminWorkflowNavigateOutHandler,
            ) {
                const vitrinAdminWorkflowRouter = new VitrinAdminWorkflowRouter(
                    uiPath,
                    commandHandler,
                    navigateOutHandler,
                );
                await vitrinAdminWorkflowRouter.configure();
                return vitrinAdminWorkflowRouter;
            },
            inject: [
                'UI_PATH',
                VitrinAdminWorkflowCommandHandler,
                VitrinAdminWorkflowNavigateOutHandler,
            ],
        },
        {
            provide: VitrinCommandRouter,
            useFactory: async function (
                uiPath: string,
                homeWorkflowjumpToHomeHandler: VitrinHomeWorkflowJumpToHomeHandler,
                adminWorkflowNavigateInHandler: VitrinAdminWorkflowNavigateInHandler,
            ) {
                const vitrinHomeWorkflowHandler = new VitrinCommandRouter(
                    uiPath,
                    homeWorkflowjumpToHomeHandler,
                    adminWorkflowNavigateInHandler,
                );
                await vitrinHomeWorkflowHandler.configure();
                return vitrinHomeWorkflowHandler;
            },
            inject: [
                'UI_PATH',
                VitrinHomeWorkflowJumpToHomeHandler,
                VitrinAdminWorkflowNavigateInHandler,
            ],
        },
        VitrinAdminWorkflowCommandHandler,
        VitrinAdminWorkflowNavigateInHandler,
        VitrinAdminWorkflowNavigateOutHandler,
        VitrinHomeWorkflowJumpToHomeHandler,
        VitrinInternalErrorHandler,
        VitrinUnknownErrorHandler,
        VitrinUnsupportedMediaErrorHandler,
    ],
})
export class VitrinModule {}
