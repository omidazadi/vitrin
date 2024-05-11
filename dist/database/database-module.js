"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const database_manager_1 = require("../infrastructures/database-manager");
const cart_item_repository_1 = require("./repositories/cart-item-repository");
const customer_repository_1 = require("./repositories/customer-repository");
const product_repository_1 = require("./repositories/product-repository");
const referral_partner_repository_1 = require("./repositories/referral-partner-repository");
const section_repository_1 = require("./repositories/section-repository");
const shop_repository_1 = require("./repositories/shop-repository");
const tag_product_repository_1 = require("./repositories/tag-product-repository");
const tag_repository_1 = require("./repositories/tag-repository");
const tag_section_repository_1 = require("./repositories/tag-section-repository");
const variety_repository_1 = require("./repositories/variety-repository");
const visitor_repository_1 = require("./repositories/visitor-repository");
const postgres_config_1 = require("../infrastructures/configs/postgres-config");
const class_validator_1 = require("class-validator");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        providers: [
            {
                provide: postgres_config_1.PostgresConfig,
                useFactory: async function () {
                    const postgresConfig = new postgres_config_1.PostgresConfig();
                    const validationErrors = await (0, class_validator_1.validate)(postgresConfig);
                    if (validationErrors.length > 0) {
                        throw new Error(validationErrors[0].toString());
                    }
                    return postgresConfig;
                },
            },
            {
                provide: database_manager_1.DatabaseManager,
                useFactory: async function (postgresConfig) {
                    const databaseManager = new database_manager_1.DatabaseManager(postgresConfig);
                    await databaseManager.executeDDL();
                    return databaseManager;
                },
                inject: [postgres_config_1.PostgresConfig],
            },
            cart_item_repository_1.CartItemRepository,
            customer_repository_1.CustomerRepository,
            product_repository_1.ProductRepository,
            referral_partner_repository_1.ReferralPartnerRepository,
            section_repository_1.SectionRepository,
            shop_repository_1.ShopRepository,
            tag_product_repository_1.TagProductRepository,
            tag_repository_1.TagRepository,
            tag_section_repository_1.TagSectionRepository,
            variety_repository_1.VarietyRepository,
            visitor_repository_1.VisitorRepository,
        ],
        exports: [
            database_manager_1.DatabaseManager,
            cart_item_repository_1.CartItemRepository,
            customer_repository_1.CustomerRepository,
            product_repository_1.ProductRepository,
            referral_partner_repository_1.ReferralPartnerRepository,
            section_repository_1.SectionRepository,
            shop_repository_1.ShopRepository,
            tag_product_repository_1.TagProductRepository,
            tag_repository_1.TagRepository,
            tag_section_repository_1.TagSectionRepository,
            variety_repository_1.VarietyRepository,
            visitor_repository_1.VisitorRepository,
        ],
    })
], DatabaseModule);
//# sourceMappingURL=database-module.js.map