import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { TcommandParser } from 'src/infrastructures/parsers/tcommand-parser';
import { ShopCustomer } from '../../../user-builder';
import { PurchaseRepository } from 'src/database/repositories/purchase-repository';
import { ShopCartWorkflowPurchaseCancelerHelper } from '../../cart-workflow/helpers/purchase-canceler';

@Injectable()
export class ShopCommandWorkflowTriggerExecuterHelper {
    private frontend: HydratedFrontend;
    private purchaseRepository: PurchaseRepository;
    private purchaseCancelerHelper: ShopCartWorkflowPurchaseCancelerHelper;

    public constructor(
        frontend: HydratedFrontend,
        purchaseRepository: PurchaseRepository,
        purchaseCancelerHelper: ShopCartWorkflowPurchaseCancelerHelper,
    ) {
        this.frontend = frontend;
        this.purchaseRepository = purchaseRepository;
        this.purchaseCancelerHelper = purchaseCancelerHelper;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async executeTrigger(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<void> {
        if (
            requestContext.user.customer.data.state === 'checkout' ||
            requestContext.user.customer.data.state === 'card-to-card'
        ) {
            const purchase = (await this.purchaseRepository.getPurchase(
                requestContext.user.customer.data.purchaseUid,
                requestContext.poolClient,
            ))!;
            await this.purchaseCancelerHelper.cancelPurchase(
                purchase,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'cart-workflow/cancel-purchase',
                {
                    forcedType: 'none',
                    replyTo:
                        purchase.customerReceiptTid !== null
                            ? purchase.customerReceiptTid
                            : undefined,
                },
            );
        }
    }
}
