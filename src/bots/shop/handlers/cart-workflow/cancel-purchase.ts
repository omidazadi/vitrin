import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { instanceToInstance } from 'class-transformer';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { PurchaseRepository } from 'src/database/repositories/purchase-repository';
import { ShopCartWorkflowPurchaseCancelerHelper } from './helpers/purchase-canceler';

@Injectable()
export class ShopCartWorkflowCancelPurchaseHandler {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private purchaseRepository: PurchaseRepository;
    private purchaseCancelerHelper: ShopCartWorkflowPurchaseCancelerHelper;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        purchaseRepository: PurchaseRepository,
        purchaseCancelerHelper: ShopCartWorkflowPurchaseCancelerHelper,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.purchaseRepository = purchaseRepository;
        this.purchaseCancelerHelper = purchaseCancelerHelper;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<void> {
        const customer = instanceToInstance(requestContext.user.customer);
        const purchase = (await this.purchaseRepository.getPurchase(
            customer.data.purchaseUid,
            requestContext.poolClient,
        ))!;
        await this.purchaseCancelerHelper.cancelPurchase(
            purchase,
            requestContext.poolClient,
        );
        customer.data = { state: 'home' };
        await this.customerRepository.updateCustomer(
            customer,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
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
