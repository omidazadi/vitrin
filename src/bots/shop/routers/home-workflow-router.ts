import { Inject, Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopHomeWorkflowAboutHandler } from '../handlers/home-workflow/about';
import { ShopHomeWorkflowFaqHandler } from '../handlers/home-workflow/faq';
import { ShopCustomer } from '../user-builder';
import { ShopProductWorkflowNavigateInHandler } from '../handlers/product-workflow/navigate-in';

@Injectable()
export class ShopHomeWorkflowRouter {
    private aboutHandler: ShopHomeWorkflowAboutHandler;
    private faqHandler: ShopHomeWorkflowFaqHandler;
    private productWorkflowNavigateInHandler: ShopProductWorkflowNavigateInHandler;
    private buttonTexts: any;

    public constructor(
        aboutHandler: ShopHomeWorkflowAboutHandler,
        faqHandler: ShopHomeWorkflowFaqHandler,
        productWorkflowNavigateInHandler: ShopProductWorkflowNavigateInHandler,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.aboutHandler = aboutHandler;
        this.faqHandler = faqHandler;
        this.productWorkflowNavigateInHandler =
            productWorkflowNavigateInHandler;
        this.buttonTexts = buttonTexts;
    }

    public async route(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<boolean> {
        if (requestContext.user.customer.data.state === 'home') {
            if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.home.faq
            ) {
                await this.faqHandler.handle(requestContext);
                return true;
            } else if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.home.about
            ) {
                await this.aboutHandler.handle(requestContext);
                return true;
            } else if (
                requestContext.telegramContext.text ===
                this.buttonTexts.state.home.vitrin
            ) {
                await this.productWorkflowNavigateInHandler.handle(
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
