import { Injectable } from '@nestjs/common';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { PurchaseRepository } from 'src/database/repositories/purchase-repository';
import { shopConstant } from '../constants/shop-constant';
import { DatabaseManager } from 'src/infrastructures/database-manager';
import { ShopCartWorkflowPurchaseCancelerHelper } from '../handlers/cart-workflow/helpers/purchase-canceler';

@Injectable()
export class ShopHangingPurchaseCollectorCronJob {
    private databaseManager: DatabaseManager;
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private purchaseRepository: PurchaseRepository;
    private cartWorkflowPurchaseCancelerHelper: ShopCartWorkflowPurchaseCancelerHelper;

    public constructor(
        databaseManager: DatabaseManager,
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        purchaseRepository: PurchaseRepository,
        cartWorkflowPurchaseCancelerHelper: ShopCartWorkflowPurchaseCancelerHelper,
    ) {
        this.databaseManager = databaseManager;
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.purchaseRepository = purchaseRepository;
        this.cartWorkflowPurchaseCancelerHelper =
            cartWorkflowPurchaseCancelerHelper;
    }

    public async collectHangingPurchases(): Promise<void> {
        const poolClient = await this.databaseManager.createTransaction();
        const beforeDate = new Date(
            Date.now() - shopConstant.purchaseDurationMinutes * 60 * 1000,
        );
        const duePurchases =
            await this.purchaseRepository.getPurchasesBeforeDate(
                beforeDate,
                poolClient,
            );
        for (const purchase of duePurchases) {
            await this.cartWorkflowPurchaseCancelerHelper.cancelPurchase(
                purchase,
                poolClient,
            );
            if (purchase.customer !== null) {
                const customer = (await this.customerRepository.getCustomer(
                    purchase.customer,
                    purchase.shop!,
                    poolClient,
                ))!;
                customer.data = { state: 'home' };
                await this.customerRepository.updateCustomer(
                    customer,
                    poolClient,
                );
                await this.frontend.sendActionMessage(
                    customer.tid,
                    'cart-workflow/cancel-purchase',
                    {
                        replyTo:
                            purchase.customerReceiptTid !== null
                                ? purchase.customerReceiptTid
                                : undefined,
                    },
                );
            }
        }
        await this.databaseManager.commitTransaction(poolClient);
    }
}
