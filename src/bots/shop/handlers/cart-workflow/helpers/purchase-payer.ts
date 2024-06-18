import { Injectable } from '@nestjs/common';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { PurchaseItemRepository } from 'src/database/repositories/purchase-item-repository';
import { PurchaseRepository } from 'src/database/repositories/purchase-repository';
import { PoolClient } from 'pg';
import { Purchase } from 'src/database/models/purchase';
import { PaymentRepository } from 'src/database/repositories/payment-repository';
import { ShopRepository } from 'src/database/repositories/shop-repository';
import { CartItemRepository } from 'src/database/repositories/cart-item-repository';

@Injectable()
export class ShopCartWorkflowPurchasePayerHelper {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private cartItemRepository: CartItemRepository;
    private purchaseRepository: PurchaseRepository;
    private purchaseItemRepository: PurchaseItemRepository;
    private paymentRepository: PaymentRepository;
    private shopRepository: ShopRepository;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        cartItemRepository: CartItemRepository,
        purchaseRepository: PurchaseRepository,
        purchaseItemRepository: PurchaseItemRepository,
        paymentRepository: PaymentRepository,
        shopRepository: ShopRepository,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.cartItemRepository = cartItemRepository;
        this.purchaseRepository = purchaseRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.paymentRepository = paymentRepository;
        this.shopRepository = shopRepository;
    }

    public async payPurchase(
        purchase: Purchase,
        poolClient: PoolClient,
    ): Promise<void> {
        purchase.status = 'paid';
        const payment = (await this.paymentRepository.getPayment(
            purchase.paymentUid,
            poolClient,
        ))!;
        payment.status = 'accepted';
        await this.paymentRepository.updatePayment(payment, poolClient);

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
            customer.data = { state: 'home' };
            await this.customerRepository.updateCustomer(customer, poolClient);
            await this.cartItemRepository.deleteCustomerCart(
                customer.id,
                customer.shop,
                poolClient,
            );

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
                'helpers/post-purchase',
                {
                    replyTo:
                        purchase.customerReceiptTid === null
                            ? undefined
                            : purchase.customerReceiptTid,
                    context: {
                        shop:
                            purchase.shop === null
                                ? undefined
                                : (await this.shopRepository.getShop(
                                      purchase.shop,
                                      poolClient,
                                  ))!,
                    },
                },
            );
        }

        if (purchase.shop !== null) {
            const shop = (await this.shopRepository.getShop(
                purchase.shop,
                poolClient,
            ))!;
            if (shop.purchaseChannelTid !== null) {
                const shopReceiptTid = await this.frontend.sendActionMessage(
                    shop.purchaseChannelTid,
                    'helpers/shop-receipt',
                    {
                        context: {
                            purchase: purchase,
                            purchaseItems: purchaseItems,
                            dateString: purchase.createdAt.toUTCString(),
                        },
                    },
                );
                purchase.shopReceiptTid = shopReceiptTid;
            }
        }

        await this.purchaseRepository.updatePurchase(purchase, poolClient);
    }
}
