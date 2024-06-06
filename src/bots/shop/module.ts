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
import { ShopGateway } from './gateway';
import { BotRunner } from 'src/infrastructures/bot-runner';
import { ShopCommandRouter } from './routers/command-router';
import { ShopInternalErrorHandler } from './handlers/common/internal-error';
import { ShopUnknownErrorHandler } from './handlers/common/unknown-error';
import { ShopUnsupportedMediaErrorHandler } from './handlers/common/unsupported-media-error';
import { Customer } from 'src/database/models/customer';
import { ShopHomeWorkflowRouter } from './routers/home-workflow-router';
import { ShopInformationWorkflowRouter } from './routers/information-workflow-router';
import { ShopProductWorkflowRouter } from './routers/product-workflow-router';
import { ShopHomeWorkflowAboutHandler } from './handlers/home-workflow/about';
import { ShopHomeWorkflowFaqHandler } from './handlers/home-workflow/faq';
import { ShopCartWorkflowRouter } from './routers/cart-workflow-router';
import { TcommandParser } from 'src/infrastructures/parsers/tcommand-parser';
import { AcommandParser } from 'src/infrastructures/parsers/acommand-parser';
import { ShopAdminWorkflowCommandHandler } from './handlers/admin-workflow/command';
import { ShopAdminWorkflowNavigateInHandler } from './handlers/admin-workflow/navigate-in';
import { ShopAdminWorkflowNavigateOutHandler } from './handlers/admin-workflow/navigate-out';
import { ShopAdminWorkflowHomeCommandExecuter } from './handlers/admin-workflow/command-executers/home/home';
import { ShopAdminWorkflowHomeFaqCommandExecuter } from './handlers/admin-workflow/command-executers/home/faq';
import { ShopAdminWorkflowHomeAboutCommandExecuter } from './handlers/admin-workflow/command-executers/home/about';
import { ShopAdminWorkflowHomeMainCommandExecuter } from './handlers/admin-workflow/command-executers/home/main';
import { ShopAdminWorkflowSectionCommandExecuter } from './handlers/admin-workflow/command-executers/section/section';
import { ShopOnMaintenanceHandler } from './handlers/common/on-maintenance';
import { ShopUpdatedHandler } from './handlers/common/updated';
import { ShopAdminWorkflowSectionTagCommandExecuter } from './handlers/admin-workflow/command-executers/section/tag';
import { ShopAdminWorkflowMaintenanceCommandExecuter } from './handlers/admin-workflow/command-executers/maintenance';
import { ShopAdminWorkflowTagCommandExecuter } from './handlers/admin-workflow/command-executers/tag';
import { ShopProductWorkflowNavigateInHandler } from './handlers/product-workflow/navigate-in';
import { ShopProductWorkflowSectionDownHandler } from './handlers/product-workflow/section-down';
import { ShopProductWorkflowSectionUpHandler } from './handlers/product-workflow/section-up';
import { ShopCommandWorkflowStartHandler } from './handlers/command-workflow/start';
import { ShopAdminWorkflowProductCommandExecuter } from './handlers/admin-workflow/command-executers/product/product';
import { ShopAdminWorkflowProductVarietyCommandExecuter } from './handlers/admin-workflow/command-executers/product/variety/variety';
import { ShopAdminWorkflowProductVarietyMediaCommandExecuter } from './handlers/admin-workflow/command-executers/product/variety/media';
import { ShopAdminWorkflowProductOptionCommandExecuter } from './handlers/admin-workflow/command-executers/product/option';
import { ShopAdminWorkflowProductTagCommandExecuter } from './handlers/admin-workflow/command-executers/product/tag';
import { ShopProductWorkflowNavigateProductHandler } from './handlers/product-workflow/navigate-product';
import { ShopProductWorkflowMorePicturesHandler } from './handlers/product-workflow/more-pictures';
import { ShopProductWorkflowNavigateOptionHandler } from './handlers/product-workflow/navigate-option';
import { ShopProductWorkflowSelectOptionHandler } from './handlers/product-workflow/select-option';
import { ShopProductWorkflowProductCameraHelper } from './handlers/product-workflow/helpers/product-camera';
import { ShopProductWorkflowRendererHelper } from './handlers/product-workflow/helpers/renderer';
import { ShopProductWorkflowSectionChainBuilderHelper } from './handlers/product-workflow/helpers/section-chain-builder';
import { ShopProductWorkflowSectionTransitionerHelper } from './handlers/product-workflow/helpers/section-transitioner';
import { BotConfig } from 'src/infrastructures/configs/bot-config';
import { ShopProductWorkflowProductUnavailableFallbackHelper } from './handlers/product-workflow/helpers/product-unavailable-fallback';
import { ShopProductWorkflowAddToCartHandler } from './handlers/product-workflow/add-to-cart';
import { ShopProductWorkflowRemoveFromCartHandler } from './handlers/product-workflow/remove-from-cart';
import { ShopCommandWorkflowSetReferralHandler } from './handlers/command-workflow/set-referral';
import { ShopAdminWorkflowReferralPartnerCommandExecuter } from './handlers/admin-workflow/command-executers/referral-partner';
import { ShopCartWorkflowNavigateInHandler } from './handlers/cart-workflow/navigate-in';
import { ShopInformationWorkflowFillEntryHandler } from './handlers/information-workflow/fill-entry';
import { ShopInformationWorkflowNavigateInHandler } from './handlers/information-workflow/navigate-in';
import { ShopInformationWorkflowNavigateOutHandler } from './handlers/information-workflow/navigate-out';
import { ShopInformationWorkflowRedoHandler } from './handlers/information-workflow/redo';
import { ShopCartWorkflowNavigateCartHandler } from './handlers/cart-workflow/navigate-cart';
import { ShopCartWorkflowNavigateOutHandler } from './handlers/cart-workflow/navigate-out';

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
                AcommandParser,

                ShopRootRouter,
                ShopAdminWorkflowRouter,
                ShopCartWorkflowRouter,
                ShopCommandRouter,
                ShopHomeWorkflowRouter,
                ShopInformationWorkflowRouter,
                ShopProductWorkflowRouter,
                ShopHomeWorkflowAboutHandler,
                ShopHomeWorkflowFaqHandler,
                ShopAdminWorkflowCommandHandler,
                ShopAdminWorkflowNavigateInHandler,
                ShopAdminWorkflowNavigateOutHandler,
                ShopProductWorkflowAddToCartHandler,
                ShopProductWorkflowMorePicturesHandler,
                ShopProductWorkflowNavigateInHandler,
                ShopProductWorkflowNavigateOptionHandler,
                ShopProductWorkflowNavigateProductHandler,
                ShopProductWorkflowRemoveFromCartHandler,
                ShopProductWorkflowSectionDownHandler,
                ShopProductWorkflowSectionUpHandler,
                ShopProductWorkflowSelectOptionHandler,
                ShopCommandWorkflowSetReferralHandler,
                ShopCommandWorkflowStartHandler,
                ShopCartWorkflowNavigateCartHandler,
                ShopCartWorkflowNavigateOutHandler,
                ShopCartWorkflowNavigateInHandler,
                ShopInternalErrorHandler,
                ShopOnMaintenanceHandler,
                ShopUnknownErrorHandler,
                ShopUnsupportedMediaErrorHandler,
                ShopUpdatedHandler,
                ShopInformationWorkflowFillEntryHandler,
                ShopInformationWorkflowNavigateInHandler,
                ShopInformationWorkflowNavigateOutHandler,
                ShopInformationWorkflowRedoHandler,
                ShopAdminWorkflowHomeCommandExecuter,
                ShopAdminWorkflowHomeFaqCommandExecuter,
                ShopAdminWorkflowHomeAboutCommandExecuter,
                ShopAdminWorkflowHomeMainCommandExecuter,
                ShopAdminWorkflowSectionCommandExecuter,
                ShopAdminWorkflowSectionTagCommandExecuter,
                ShopAdminWorkflowMaintenanceCommandExecuter,
                ShopAdminWorkflowReferralPartnerCommandExecuter,
                ShopAdminWorkflowTagCommandExecuter,
                ShopAdminWorkflowProductCommandExecuter,
                ShopAdminWorkflowProductVarietyCommandExecuter,
                ShopAdminWorkflowProductVarietyMediaCommandExecuter,
                ShopAdminWorkflowProductOptionCommandExecuter,
                ShopAdminWorkflowProductTagCommandExecuter,
                ShopProductWorkflowProductCameraHelper,
                ShopProductWorkflowProductUnavailableFallbackHelper,
                ShopProductWorkflowRendererHelper,
                ShopProductWorkflowSectionChainBuilderHelper,
                ShopProductWorkflowSectionTransitionerHelper,
            ],
        };
    }
}
