import { Module } from '@nestjs/common';
import { DatabaseManager } from '../infrastructures/database-manager';
import { CartItemRepository } from './repositories/cart-item-repository';
import { CustomerRepository } from './repositories/customer-repository';
import { ProductRepository } from './repositories/product-repository';
import { ReferralPartnerRepository } from './repositories/referral-partner-repository';
import { SectionRepository } from './repositories/section-repository';
import { ShopRepository } from './repositories/shop-repository';
import { TagProductRepository } from './repositories/tag-product-repository';
import { TagRepository } from './repositories/tag-repository';
import { TagSectionRepository } from './repositories/tag-section-repository';
import { VarietyRepository } from './repositories/variety-repository';
import { VisitorRepository } from './repositories/visitor-repository';
import { PostgresConfig } from 'src/infrastructures/configs/postgres-config';
import { validate } from 'class-validator';
import { OptionRepository } from './repositories/option-repository';
import { OptionVarietyRepository } from './repositories/option-variety-repository';
import { VarietyMediaRepository } from './repositories/variety-media-repository';
import { PaymentRepository } from './repositories/payment-repository';
import { PurchaseItemRepository } from './repositories/purchase-item-repository';
import { PurchaseRepository } from './repositories/purchase-repository';
import { ReferralDepositStatementRepository } from './repositories/referral-deposit-statement';

@Module({
    providers: [
        {
            provide: PostgresConfig,
            useFactory: async function () {
                const postgresConfig = new PostgresConfig();
                const validationErrors = await validate(postgresConfig);
                if (validationErrors.length > 0) {
                    throw new Error(validationErrors[0].toString());
                }
                return postgresConfig;
            },
        },

        {
            provide: DatabaseManager,
            useFactory: async function (postgresConfig: PostgresConfig) {
                const databaseManager = new DatabaseManager(postgresConfig);
                await databaseManager.executeDDL();
                return databaseManager;
            },
            inject: [PostgresConfig],
        },
        CartItemRepository,
        CustomerRepository,
        OptionRepository,
        OptionVarietyRepository,
        PaymentRepository,
        ProductRepository,
        PurchaseItemRepository,
        PurchaseRepository,
        ReferralDepositStatementRepository,
        ReferralPartnerRepository,
        SectionRepository,
        ShopRepository,
        TagProductRepository,
        TagRepository,
        TagSectionRepository,
        VarietyMediaRepository,
        VarietyRepository,
        VisitorRepository,
    ],
    exports: [
        DatabaseManager,
        CartItemRepository,
        CustomerRepository,
        OptionRepository,
        OptionVarietyRepository,
        PaymentRepository,
        ProductRepository,
        PurchaseItemRepository,
        PurchaseRepository,
        ReferralDepositStatementRepository,
        ReferralPartnerRepository,
        SectionRepository,
        ShopRepository,
        TagProductRepository,
        TagRepository,
        TagSectionRepository,
        VarietyMediaRepository,
        VarietyRepository,
        VisitorRepository,
    ],
})
export class DatabaseModule {}
