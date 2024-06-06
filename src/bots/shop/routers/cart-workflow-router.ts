import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopCustomer } from '../user-builder';
import { ShopCartWorkflowNavigateOutHandler } from '../handlers/cart-workflow/navigate-out';

@Injectable()
export class ShopCartWorkflowRouter {
    private navigateOutHandler: ShopCartWorkflowNavigateOutHandler;
    private buttonTexts: any;

    public constructor(
        navigateOutHandler: ShopCartWorkflowNavigateOutHandler,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.navigateOutHandler = navigateOutHandler;
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
                this.buttonTexts.state.cart.back
            ) {
                return false;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}
