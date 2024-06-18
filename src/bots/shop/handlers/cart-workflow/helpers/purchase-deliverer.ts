import { Injectable } from '@nestjs/common';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { PurchaseItemRepository } from 'src/database/repositories/purchase-item-repository';
import { PurchaseRepository } from 'src/database/repositories/purchase-repository';
import { PoolClient } from 'pg';
import { Purchase } from 'src/database/models/purchase';
import { ShopRepository } from 'src/database/repositories/shop-repository';

@Injectable()
export class ShopCartWorkflowPurchaseDelivererHelper {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private purchaseRepository: PurchaseRepository;
    private purchaseItemRepository: PurchaseItemRepository;
    private shopRepository: ShopRepository;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        purchaseRepository: PurchaseRepository,
        purchaseItemRepository: PurchaseItemRepository,
        shopRepository: ShopRepository,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.purchaseRepository = purchaseRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.shopRepository = shopRepository;
    }

    public async deliverPurchase(
        purchase: Purchase,
        trackingNumbers: Array<string> | null,
        poolClient: PoolClient,
    ): Promise<void> {
        purchase.status = 'delivered';
        purchase.trackingNumbers = trackingNumbers;
        await this.purchaseRepository.updatePurchase(purchase, poolClient);

        const purchaseItems =
            await this.purchaseItemRepository.getPurchaseItems(
                purchase.uid,
                poolClient,
            );

        if (purchase.customer !== null) {
            const customer = (await this.customerRepository.getCustomer(
                purchase.customer,
                purchase.shop!,
                poolClient,
            ))!;

            if (purchase.customerReceiptTid !== null) {
                await this.frontend.modifyActionMessage(
                    customer.tid,
                    purchase.customerReceiptTid,
                    'helpers/customer-receipt',
                    {
                        context: {
                            purchase: purchase,
                            purchaseItems: purchaseItems,
                            dateString: purchase.createdAt.toUTCString(),
                        },
                    },
                );
            }
            await this.frontend.sendActionMessage(
                customer.tid,
                'helpers/being-delivered',
                {
                    replyTo:
                        purchase.customerReceiptTid === null
                            ? undefined
                            : purchase.customerReceiptTid,
                    context: { purchase: purchase },
                },
            );
        }

        if (purchase.shopReceiptTid !== null && purchase.shop !== null) {
            const shop = (await this.shopRepository.getShop(
                purchase.shop,
                poolClient,
            ))!;
            if (shop.purchaseChannelTid !== null) {
                await this.frontend.modifyActionMessage(
                    shop.purchaseChannelTid,
                    purchase.shopReceiptTid,
                    'helpers/shop-receipt',
                    {
                        context: {
                            purchase: purchase,
                            purchaseItems: purchaseItems,
                            dateString: purchase.createdAt.toUTCString(),
                        },
                    },
                );
            }
        }
    }
}
