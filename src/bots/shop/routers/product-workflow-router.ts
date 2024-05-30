import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopCustomer } from '../user-builder';
import { ShopProductWorkflowNavigateInHandler } from '../handlers/product-workflow/navigate-in';
import { ShopProductWorkflowSectionDownHandler } from '../handlers/product-workflow/section-down';
import { ShopProductWorkflowSectionUpHandler } from '../handlers/product-workflow/section-up';

@Injectable()
export class ShopProductWorkflowRouter {
    private sectionDownHandler: ShopProductWorkflowSectionDownHandler;
    private sectionUpHandler: ShopProductWorkflowSectionUpHandler;
    private buttonTexts: any;

    public constructor(
        sectionDownHandler: ShopProductWorkflowSectionDownHandler,
        sectionUpHandler: ShopProductWorkflowSectionUpHandler,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.sectionDownHandler = sectionDownHandler;
        this.sectionUpHandler = sectionUpHandler;
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
            } else {
                return false;
            }
        } else {
            return false;
        }
    }
}
