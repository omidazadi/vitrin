import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopCustomer } from '../user-builder';
import { ShopProductWorkflowSectionDownHandler } from '../handlers/product-workflow/section-down';
import { ShopProductWorkflowSectionUpHandler } from '../handlers/product-workflow/section-up';
import { ShopProductWorkflowNavigateProductHandler } from '../handlers/product-workflow/navigate-product';
import { ShopProductWorkflowMorePicturesHandler } from '../handlers/product-workflow/more-pictures';
import { ShopProductWorkflowNavigateOptionHandler } from '../handlers/product-workflow/navigate-option';
import { ShopProductWorkflowSelectOptionHandler } from '../handlers/product-workflow/select-option';
import { ShopProductWorkflowAddToCartHandler } from '../handlers/product-workflow/add-to-cart';
import { ShopProductWorkflowRemoveFromCartHandler } from '../handlers/product-workflow/remove-from-cart';

@Injectable()
export class ShopProductWorkflowRouter {
    private addToCartHandler: ShopProductWorkflowAddToCartHandler;
    private morePicturesHandler: ShopProductWorkflowMorePicturesHandler;
    private sectionDownHandler: ShopProductWorkflowSectionDownHandler;
    private sectionUpHandler: ShopProductWorkflowSectionUpHandler;
    private navigateProductHandler: ShopProductWorkflowNavigateProductHandler;
    private removeFromCartHandler: ShopProductWorkflowRemoveFromCartHandler;
    private navigateOptionHandler: ShopProductWorkflowNavigateOptionHandler;
    private selectOptionHandler: ShopProductWorkflowSelectOptionHandler;
    private buttonTexts: any;

    public constructor(
        addToCartHandler: ShopProductWorkflowAddToCartHandler,
        morePicturesHandler: ShopProductWorkflowMorePicturesHandler,
        sectionDownHandler: ShopProductWorkflowSectionDownHandler,
        sectionUpHandler: ShopProductWorkflowSectionUpHandler,
        navigateProductHandler: ShopProductWorkflowNavigateProductHandler,
        removeFromCartHandler: ShopProductWorkflowRemoveFromCartHandler,
        navigateOptionHandler: ShopProductWorkflowNavigateOptionHandler,
        selectOptionHandler: ShopProductWorkflowSelectOptionHandler,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.addToCartHandler = addToCartHandler;
        this.morePicturesHandler = morePicturesHandler;
        this.sectionDownHandler = sectionDownHandler;
        this.sectionUpHandler = sectionUpHandler;
        this.navigateProductHandler = navigateProductHandler;
        this.removeFromCartHandler = removeFromCartHandler;
        this.navigateOptionHandler = navigateOptionHandler;
        this.selectOptionHandler = selectOptionHandler;
        this.buttonTexts = buttonTexts;
    }

    public async route(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<boolean> {
        if (requestContext.user.customer.data.state === 'section') {
            if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.section.back
            ) {
                await this.sectionUpHandler.handle(requestContext);
                return true;
            } else {
                await this.sectionDownHandler.handle(requestContext);
                return true;
            }
        } else if (requestContext.user.customer.data.state === 'product') {
            if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.product.back
            ) {
                await this.sectionUpHandler.handle(requestContext);
                return true;
            } else if (
                requestContext.telegramContext.text ===
                    this.buttonTexts.state.product.next ||
                requestContext.telegramContext.text ===
                    this.buttonTexts.state.product.previous
            ) {
                await this.navigateProductHandler.handle(requestContext);
                return true;
            } else if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.product.more_pictures
            ) {
                await this.morePicturesHandler.handle(requestContext);
                return true;
            } else if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.product.add_to_cart
            ) {
                await this.addToCartHandler.handle(requestContext);
                return true;
            } else if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.product.remove_from_cart
            ) {
                await this.removeFromCartHandler.handle(requestContext);
                return true;
            } else {
                await this.navigateOptionHandler.handle(requestContext);
                return true;
            }
        } else if (requestContext.user.customer.data.state === 'option') {
            await this.selectOptionHandler.handle(requestContext);
            return true;
        } else {
            return false;
        }
    }
}
