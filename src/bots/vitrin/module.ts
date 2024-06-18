import { readFile } from 'fs/promises';
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
import { VitrinAdminWorkflowShopCommandExecuter } from './handlers/admin-workflow/command-executers/shop';
import { TcommandParser } from 'src/infrastructures/parsers/tcommand-parser';
import { AcommandParser } from 'src/infrastructures/parsers/acommand-parser';
import { BotConfig } from 'src/infrastructures/configs/bot-config';
import { VitrinReferralPanelWorkflowRouter } from './routers/referral-panel-workflow-router';
import { VitrinHomeWorkflowRouter } from './routers/home-workflow-router';
import { VitrinReferralPanelWorkflowNavigateInHandler } from './handlers/referral-panel-workflow/navigate-in';
import { VitrinReferralPanelWorkflowNavigateOutHandler } from './handlers/referral-panel-workflow/navigate-out';
import { VitrinReferralPanelWorkflowShowStatisticsHandler } from './handlers/referral-panel-workflow/show-statistics';

@Module({
    imports: [DatabaseModule],
    providers: [
        {
            provide: 'UI_PATH',
            useValue: 'src/bots/vitrin/views',
        },
        {
            provide: 'BUTTON_TEXTS',
            useFactory: async function (uiPath: string) {
                return JSON.parse(
                    (
                        await readFile(`${uiPath}/button-texts.json`, 'utf8')
                    ).toString(),
                );
            },
            inject: ['UI_PATH'],
        },
        {
            provide: 'RUNNING_SHOPS',
            useValue: {},
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
            provide: BotConfig,
            useFactory: async function () {
                const botConfig = new BotConfig();
                const validationErrors = await validate(botConfig);
                if (validationErrors.length > 0) {
                    throw new Error(validationErrors[0].toString());
                }
                return botConfig;
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
            useFactory: async function (
                grammyBot: GrammyBot,
                uiPath: string,
                buttonTexts: any,
            ) {
                const dryFrontend = new DryFrontend(
                    grammyBot,
                    uiPath,
                    buttonTexts,
                );
                await dryFrontend.configure();
                return dryFrontend;
            },
            inject: [GrammyBot, 'UI_PATH', 'BUTTON_TEXTS'],
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
        TcommandParser,
        AcommandParser,

        VitrinRootRouter,
        VitrinAdminWorkflowRouter,
        VitrinCommandRouter,
        VitrinHomeWorkflowRouter,
        VitrinReferralPanelWorkflowRouter,
        VitrinAdminWorkflowCommandHandler,
        VitrinAdminWorkflowNavigateInHandler,
        VitrinAdminWorkflowNavigateOutHandler,
        VitrinHomeWorkflowJumpToHomeHandler,
        VitrinReferralPanelWorkflowNavigateInHandler,
        VitrinReferralPanelWorkflowNavigateOutHandler,
        VitrinReferralPanelWorkflowShowStatisticsHandler,
        VitrinInternalErrorHandler,
        VitrinUnknownErrorHandler,
        VitrinUnsupportedMediaErrorHandler,
        VitrinAdminWorkflowShopCommandExecuter,
    ],
})
export class VitrinModule {}
