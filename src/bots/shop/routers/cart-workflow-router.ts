import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopCustomer } from '../user-builder';
import { ShopCartWorkflowNavigateOutHandler } from '../handlers/cart-workflow/navigate-out';
import { ShopCartWorkflowDeleteMissingHandler } from '../handlers/cart-workflow/delete-missing';
import { ShopCartWorkflowNavigateCheckoutHandler } from '../handlers/cart-workflow/navigate-checkout';
import { ShopCartWorkflowNavigateCartHandler } from '../handlers/cart-workflow/navigate-cart';
import { ShopCartWorkflowCancelPurchaseHandler } from '../handlers/cart-workflow/cancel-purchase';
import { ShopComingSoonHandler } from '../handlers/common/coming-soon';
import { ShopCartWorkflowNavigateCardToCardHandler } from '../handlers/cart-workflow/navigate-card-to-card';

@Injectable()
export class ShopCartWorkflowRouter {
    private navigateOutHandler: ShopCartWorkflowNavigateOutHandler;
    private navigateCartHandler: ShopCartWorkflowNavigateCartHandler;
    private navigateCheckoutHandler: ShopCartWorkflowNavigateCheckoutHandler;
    private deleteMissingHandler: ShopCartWorkflowDeleteMissingHandler;
    private cancelPurchaseHandler: ShopCartWorkflowCancelPurchaseHandler;
    private navigateCardToCardHandler: ShopCartWorkflowNavigateCardToCardHandler;
    private comingSoonHandler: ShopComingSoonHandler;
    private buttonTexts: any;

    public constructor(
        navigateOutHandler: ShopCartWorkflowNavigateOutHandler,
        navigateCartHandler: ShopCartWorkflowNavigateCartHandler,
        navigateCheckoutHandler: ShopCartWorkflowNavigateCheckoutHandler,
        deleteMissingHandler: ShopCartWorkflowDeleteMissingHandler,
        cancelPurchaseHandler: ShopCartWorkflowCancelPurchaseHandler,
        navigateCardToCardHandler: ShopCartWorkflowNavigateCardToCardHandler,
        comingSoonHandler: ShopComingSoonHandler,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.navigateOutHandler = navigateOutHandler;
        this.navigateCartHandler = navigateCartHandler;
        this.navigateCheckoutHandler = navigateCheckoutHandler;
        this.deleteMissingHandler = deleteMissingHandler;
        this.cancelPurchaseHandler = cancelPurchaseHandler;
        this.navigateCardToCardHandler = navigateCardToCardHandler;
        this.comingSoonHandler = comingSoonHandler;
        this.buttonTexts = buttonTexts;
    }

    public async route(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<boolean> {
        if (requestContext.user.customer.data.state === 'cart') {
            if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.cart.back
            ) {
                await this.navigateOutHandler.handle(requestContext);
                return true;
            } else if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.cart.pay
            ) {
                await this.navigateCheckoutHandler.handle(requestContext);
                return true;
            } else {
                return false;
            }
        } else if (
            requestContext.user.customer.data.state === 'missing-items'
        ) {
            if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.missing_items.back
            ) {
                await this.navigateCartHandler.handle(requestContext);
                return true;
            } else if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.missing_items.yes
            ) {
                await this.deleteMissingHandler.handle(requestContext);
                return true;
            } else {
                return false;
            }
        } else if (requestContext.user.customer.data.state === 'checkout') {
            if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.checkout.cancel
            ) {
                await this.cancelPurchaseHandler.handle(requestContext);
                return true;
            } else if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.checkout.card_to_card
            ) {
                await this.navigateCardToCardHandler.handle(requestContext);
                return true;
            } else if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.checkout.ipg
            ) {
                await this.comingSoonHandler.handle(requestContext);
                return true;
            } else {
                return false;
            }
        } else if (requestContext.user.customer.data.state === 'card-to-card') {
            if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.card_to_card.cancel
            ) {
                await this.cancelPurchaseHandler.handle(requestContext);
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}
