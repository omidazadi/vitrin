import { readFile } from 'fs/promises';
import { DynamicModule, Module } from '@nestjs/common';
import { Bot as GrammyBot } from 'grammy';
import { ShopUserBuilder } from './user-builder';
import { ContextManager } from 'src/infrastructures/context/context-manager';
import { ShopRootRouter } from './routers/root-router';
import { ShopAdminWorkflowRouter } from './routers/admin-workflow-router';
import { DatabaseModule } from 'src/database/database-module';
import { Logger } from 'src/infrastructures/logger';
import { DryFrontend } from 'src/infrastructures/frontend/dry-frontend';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { LoggerConfig } from 'src/infrastructures/configs/logger-config';
import { validate } from 'class-validator';
import { ShopHomeWorkflowJumpToHomeHandler } from './handlers/home-workflow/jump-to-home';
import { ShopGateway } from './gateway';
import { BotRunner } from 'src/infrastructures/bot-runner';
import { ShopCommandRouter } from './routers/command-router';
import { ShopInternalErrorHandler } from './handlers/common/internal-error';
import { ShopUnknownErrorHandler } from './handlers/common/unknown-error';
import { ShopUnsupportedMediaErrorHandler } from './handlers/common/unsupported-media-error';
import { TcommandParser } from 'src/infrastructures/tcommand-parser';
import { Customer } from 'src/database/models/customer';
import { ShopHomeWorkflowSetReferralHandler } from './handlers/home-workflow/set-referral';
import { ShopHomeWorkflowRouter } from './routers/home-workflow-router';
import { ShopInformationWorkflowRouter } from './routers/information-workflow-router';
import { ShopProductWorkflowRouter } from './routers/product-workflow-router';
import { ShopHomeWorkflowAboutHandler } from './handlers/home-workflow/about';
import { ShopHomeWorkflowFaqHandler } from './handlers/home-workflow/faq';
import { ShopCheckoutWorkflowRouter } from './routers/checkout-workflow-router';

@Module({})
export class ShopModule {
    public static register(options: Record<string, any>): DynamicModule {
        return {
            module: ShopModule,
            imports: [DatabaseModule],
            providers: [
                {
                    provide: 'UI_PATH',
                    useValue: 'src/bots/shop/views',
                },
                {
                    provide: 'BUTTON_TEXTS',
                    useFactory: async function (uiPath: string) {
                        return JSON.parse(
                            (
                                await readFile(
                                    `${uiPath}/button-texts.json`,
                                    'utf8',
                                )
                            ).toString(),
                        );
                    },
                    inject: ['UI_PATH'],
                },
                {
                    provide: 'NAME',
                    useValue: options.name,
                },
                {
                    provide: 'BOT_TOKEN',
                    useValue: options.botToken,
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
                    useFactory: async function (botToken: string) {
                        const grammyBot = new GrammyBot(botToken);
                        return grammyBot;
                    },
                    inject: ['BOT_TOKEN'],
                },
                {
                    provide: DryFrontend,
                    useFactory: async function (
                        grammyBot: GrammyBot,
                        uiPath: string,
                    ) {
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
                        const logger = new Logger(
                            dryFrontend,
                            grammyBot,
                            loggerConfig,
                        );
                        await logger.configure();
                        return logger;
                    },
                    inject: [DryFrontend, GrammyBot, LoggerConfig],
                },
                ContextManager<Customer>,
                {
                    provide: 'USER_BUILDER',
                    useClass: ShopUserBuilder,
                },
                {
                    provide: 'GATEWAY',
                    useClass: ShopGateway,
                },
                BotRunner,
                TcommandParser,

                ShopRootRouter,
                ShopAdminWorkflowRouter,
                ShopCheckoutWorkflowRouter,
                ShopCommandRouter,
                ShopHomeWorkflowRouter,
                ShopInformationWorkflowRouter,
                ShopProductWorkflowRouter,
                ShopHomeWorkflowAboutHandler,
                ShopHomeWorkflowFaqHandler,
                ShopHomeWorkflowJumpToHomeHandler,
                ShopHomeWorkflowSetReferralHandler,
                ShopInternalErrorHandler,
                ShopUnknownErrorHandler,
                ShopUnsupportedMediaErrorHandler,
            ],
        };
    }
}
