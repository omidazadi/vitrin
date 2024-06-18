import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { PurchaseRepository } from 'src/database/repositories/purchase-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { ShopCartWorkflowPurchaseCancelerHelper } from '../../cart-workflow/helpers/purchase-canceler';
import { ShopCartWorkflowPurchaseDelivererHelper } from '../../cart-workflow/helpers/purchase-deliverer';
import { ShopCartWorkflowPurchasePayerHelper } from '../../cart-workflow/helpers/purchase-payer';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { PurchaseItemRepository } from 'src/database/repositories/purchase-item-repository';

@Injectable()
export class ShopAdminWorkflowPurchaseCommandExecuter {
    private frontend: HydratedFrontend;
    private shopCartWorkflowPurchaseCancelerHelper: ShopCartWorkflowPurchaseCancelerHelper;
    private shopCartWorkflowPurchaseDelivererHelper: ShopCartWorkflowPurchaseDelivererHelper;
    private shopCartWorkflowPurchasePayerHelper: ShopCartWorkflowPurchasePayerHelper;
    private purchaseRepository: PurchaseRepository;
    private purchaseItemRepository: PurchaseItemRepository;
    private customerRepository: CustomerRepository;

    public constructor(
        frontend: HydratedFrontend,
        shopCartWorkflowPurchaseCancelerHelper: ShopCartWorkflowPurchaseCancelerHelper,
        shopCartWorkflowPurchaseDelivererHelper: ShopCartWorkflowPurchaseDelivererHelper,
        shopCartWorkflowPurchasePayerHelper: ShopCartWorkflowPurchasePayerHelper,
        purchaseRepository: PurchaseRepository,
        purchaseItemRepository: PurchaseItemRepository,
        customerRepository: CustomerRepository,
    ) {
        this.frontend = frontend;
        this.shopCartWorkflowPurchaseCancelerHelper =
            shopCartWorkflowPurchaseCancelerHelper;
        this.shopCartWorkflowPurchaseDelivererHelper =
            shopCartWorkflowPurchaseDelivererHelper;
        this.shopCartWorkflowPurchasePayerHelper =
            shopCartWorkflowPurchasePayerHelper;
        this.purchaseRepository = purchaseRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.customerRepository = customerRepository;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'cancel') {
            await this.cancelPurchase(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'pay') {
            await this.payPurchase(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'deliver') {
            await this.deliverPurchase(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'show') {
            await this.showPurchase(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else {
            await this.error(requestContext);
        }
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async cancelPurchase(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        const purchase = await this.purchaseRepository.getPurchase(
            tokens[0],
            requestContext.poolClient,
        );
        if (purchase === null || purchase.status === 'canceled') {
            await this.error(requestContext);
            return;
        }

        const customer =
            purchase.customer === null || purchase.shop === null
                ? null
                : await this.customerRepository.getCustomer(
                      purchase.customer,
                      purchase.shop,
                      requestContext.poolClient,
                  );
        if (customer === null) {
            await this.error(requestContext);
            return;
        }

        await this.shopCartWorkflowPurchaseCancelerHelper.cancelPurchase(
            purchase,
            requestContext.poolClient,
        );

        let keyboardType: 'none' | 'keyboard' = 'none';
        if (
            customer.data.state === 'card-to-card' ||
            customer.data.state === 'checkout'
        ) {
            keyboardType = 'keyboard';
            customer.data = { state: 'home' };
            await this.customerRepository.updateCustomer(
                customer,
                requestContext.poolClient,
            );
        }

        await this.frontend.sendActionMessage(
            customer.tid,
            'cart-workflow/cancel-purchase',
            {
                forcedType: keyboardType,
                replyTo:
                    purchase.customerReceiptTid !== null
                        ? purchase.customerReceiptTid
                        : undefined,
            },
        );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            { context: { scenario: 'done' } },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async payPurchase(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        const purchase = await this.purchaseRepository.getPurchase(
            tokens[0],
            requestContext.poolClient,
        );
        if (purchase === null || purchase.status !== 'pending') {
            await this.error(requestContext);
            return;
        }

        await this.shopCartWorkflowPurchasePayerHelper.payPurchase(
            purchase,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            { context: { scenario: 'done' } },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async deliverPurchase(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1 && tokens.length !== 2) {
            await this.error(requestContext);
            return;
        }

        const purchase = await this.purchaseRepository.getPurchase(
            tokens[0],
            requestContext.poolClient,
        );
        if (purchase === null || purchase.status !== 'paid') {
            await this.error(requestContext);
            return;
        }
        await this.shopCartWorkflowPurchaseDelivererHelper.deliverPurchase(
            purchase,
            tokens.length === 1 ? [] : tokens[1].split(','),
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            { context: { scenario: 'done' } },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showPurchase(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        const purchase = await this.purchaseRepository.getPurchase(
            tokens[0],
            requestContext.poolClient,
        );
        if (purchase === null) {
            await this.error(requestContext);
            return;
        }
        const purchaseItems =
            await this.purchaseItemRepository.getPurchaseItems(
                purchase.uid,
                requestContext.poolClient,
            );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
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

    private async error(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<never> {
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            { context: { scenario: 'error' } },
        );
        throw new ExpectedError();
    }
}
