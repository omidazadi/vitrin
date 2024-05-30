import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Customer } from 'src/database/models/customer';
import { Shop } from 'src/database/models/shop';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { ShopRepository } from 'src/database/repositories/shop-repository';
import { TelegramContext } from 'src/infrastructures/context/telegram-context';
import { UserBuilderInterface } from 'src/infrastructures/interfaces/user-builder';

@Injectable()
export class ShopUserBuilder implements UserBuilderInterface<ShopCustomer> {
    private customerRepository: CustomerRepository;
    private shopRepository: ShopRepository;

    public constructor(
        customerRepository: CustomerRepository,
        shopRepository: ShopRepository,
    ) {
        this.customerRepository = customerRepository;
        this.shopRepository = shopRepository;
    }

    public async buildUser(
        telegramContext: TelegramContext,
        poolClient: PoolClient,
    ): Promise<ShopCustomer> {
        const shop = await this.shopRepository.getShopByTid(
            telegramContext.me,
            poolClient,
        );
        if (shop === null) {
            throw new Error('Shop does not seem to be loaded correctly.');
        }

        let customer =
            await this.customerRepository.getCustomerByTidAndShopLocking(
                telegramContext.tid,
                shop.name,
                poolClient,
            );
        if (customer !== null) {
            return {
                shop: shop,
                customer: customer,
            };
        } else {
            return {
                shop: shop,
                customer: await this.customerRepository.createCustomer(
                    telegramContext.tid,
                    { state: 'home' },
                    null,
                    null,
                    null,
                    null,
                    null,
                    shop.maintenanceVersion,
                    shop.name,
                    poolClient,
                ),
            };
        }
    }
}

export type ShopCustomer = {
    shop: Shop;
    customer: Customer;
};
