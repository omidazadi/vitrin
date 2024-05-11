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
        ProductRepository,
        ReferralPartnerRepository,
        SectionRepository,
        ShopRepository,
        TagProductRepository,
        TagRepository,
        TagSectionRepository,
        VarietyRepository,
        VisitorRepository,
    ],
    exports: [
        DatabaseManager,
        CartItemRepository,
        CustomerRepository,
        ProductRepository,
        ReferralPartnerRepository,
        SectionRepository,
        ShopRepository,
        TagProductRepository,
        TagRepository,
        TagSectionRepository,
        VarietyRepository,
        VisitorRepository,
    ],
})
export class DatabaseModule {}
