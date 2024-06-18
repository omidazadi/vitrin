import { Injectable } from '@nestjs/common';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { PurchaseItemRepository } from 'src/database/repositories/purchase-item-repository';
import { PurchaseRepository } from 'src/database/repositories/purchase-repository';
import { PoolClient } from 'pg';
import { Purchase } from 'src/database/models/purchase';
import { VarietyRepository } from 'src/database/repositories/variety-repository';
import { PaymentRepository } from 'src/database/repositories/payment-repository';
import { ShopRepository } from 'src/database/repositories/shop-repository';

@Injectable()
export class ShopCartWorkflowPurchaseCancelerHelper {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private varietyRepository: VarietyRepository;
    private purchaseRepository: PurchaseRepository;
    private purchaseItemRepository: PurchaseItemRepository;
    private paymentRepository: PaymentRepository;
    private shopRepository: ShopRepository;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        varietyRepository: VarietyRepository,
        purchaseRepository: PurchaseRepository,
        purchaseItemRepository: PurchaseItemRepository,
        paymentRepository: PaymentRepository,
        shopRepository: ShopRepository,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.varietyRepository = varietyRepository;
        this.purchaseRepository = purchaseRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.paymentRepository = paymentRepository;
        this.shopRepository = shopRepository;
    }

    public async cancelPurchase(
        purchase: Purchase,
        poolClient: PoolClient,
    ): Promise<void> {
        purchase.status = 'canceled';
        await this.purchaseRepository.updatePurchase(purchase, poolClient);
        const payment = (await this.paymentRepository.getPayment(
            purchase.paymentUid,
            poolClient,
        ))!;
        payment.status = 'rejected';
        await this.paymentRepository.updatePayment(payment, poolClient);

        const purchaseItems =
            await this.purchaseItemRepository.getPurchaseItems(
                purchase.uid,
                poolClient,
            );
        for (const purchaseItem of purchaseItems) {
            if (purchaseItem.variety !== null) {
                const variety = (await this.varietyRepository.getVariety(
                    purchaseItem.variety,
                    purchaseItem.product!,
                    purchaseItem.shop!,
                    poolClient,
                ))!;
                variety.stock += 1;
                await this.varietyRepository.updateVariety(variety, poolClient);
            }
        }

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
