import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopCustomer } from '../user-builder';
import { ShopInformationWorkflowNavigateOutHandler } from '../handlers/information-workflow/navigate-out';
import { ShopInformationWorkflowFillEntryHandler } from '../handlers/information-workflow/fill-entry';
import { ShopInformationWorkflowRedoHandler } from '../handlers/information-workflow/redo';
import { ShopCartWorkflowNavigateCartHandler } from '../handlers/cart-workflow/navigate-cart';

@Injectable()
export class ShopInformationWorkflowRouter {
    private fillEntryHandler: ShopInformationWorkflowFillEntryHandler;
    private navigateOutHandler: ShopInformationWorkflowNavigateOutHandler;
    private redoHandler: ShopInformationWorkflowRedoHandler;
    private cartWorkflowNavigateCartHandler: ShopCartWorkflowNavigateCartHandler;
    private buttonTexts: any;

    public constructor(
        fillEntryHandler: ShopInformationWorkflowFillEntryHandler,
        navigateOutHandler: ShopInformationWorkflowNavigateOutHandler,
        redoHandler: ShopInformationWorkflowRedoHandler,
        cartWorkflowNavigateCartHandler: ShopCartWorkflowNavigateCartHandler,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.fillEntryHandler = fillEntryHandler;
        this.navigateOutHandler = navigateOutHandler;
        this.redoHandler = redoHandler;
        this.cartWorkflowNavigateCartHandler = cartWorkflowNavigateCartHandler;
        this.buttonTexts = buttonTexts;
    }

    public async route(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<boolean> {
        if (
            requestContext.user.customer.data.state ===
            'information-questionnaire'
        ) {
            if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.information_questionnaire.back
            ) {
                await this.navigateOutHandler.handle(requestContext);
                return true;
            } else {
                await this.fillEntryHandler.handle(requestContext);
                return true;
            }
        } else if (
            requestContext.user.customer.data.state === 'information-document'
        ) {
            if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.information_document.back
            ) {
                await this.navigateOutHandler.handle(requestContext);
                return true;
            } else if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.information_document.redo
            ) {
                await this.redoHandler.handle(requestContext);
                return true;
            } else if (
                requestContext.telegramContext.text ===
                    this.buttonTexts.state.information_document.continue &&
                requestContext.user.customer.data.next === 'cart'
            ) {
                await this.cartWorkflowNavigateCartHandler.handle(
                    requestContext,
                );
                return true;
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}
