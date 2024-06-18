import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { instanceToInstance } from 'class-transformer';
import { ShopCartWorkflowCartHyderaterHelper } from './helpers/cart-hyderater';
import { CartItemRepository } from 'src/database/repositories/cart-item-repository';
import { shopConstant } from '../../constants/shop-constant';

@Injectable()
export class ShopCartWorkflowDeleteMissingHandler {
    private frontend: HydratedFrontend;
    private cartItemRepository: CartItemRepository;
    private customerRepository: CustomerRepository;
    private cartHyderaterHelper: ShopCartWorkflowCartHyderaterHelper;

    public constructor(
        frontend: HydratedFrontend,
        cartItemRepository: CartItemRepository,
        customerRepository: CustomerRepository,
        cartHyderaterHelper: ShopCartWorkflowCartHyderaterHelper,
    ) {
        this.frontend = frontend;
        this.cartItemRepository = cartItemRepository;
        this.customerRepository = customerRepository;
        this.cartHyderaterHelper = cartHyderaterHelper;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<void> {
        const customer = instanceToInstance(requestContext.user.customer);
        const cart = await this.cartItemRepository.getCustomerCart(
            customer.id,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        const [hyderatedCart, sum] =
            await this.cartHyderaterHelper.hyderateCart(requestContext, cart);
        for (const hyderatedItem of hyderatedCart) {
            if (hyderatedItem[4] === false) {
                const cartItem = hyderatedItem[0];
                await this.cartItemRepository.deleteCartItem(
                    cartItem.customer,
                    cartItem.product,
                    cartItem.variety,
                    cartItem.shop,
                    requestContext.poolClient,
                );
            }
        }

        const cleanedCart = await this.cartItemRepository.getCustomerCart(
            customer.id,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );

        const [cleanedHydratedCart, cleanedSum] =
            await this.cartHyderaterHelper.hyderateCart(
                requestContext,
                cleanedCart,
            );

        customer.data = { state: 'cart' };
        await this.customerRepository.updateCustomer(
            customer,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'cart-workflow/delete-missing',
            {
                context: {
                    cart: cleanedHydratedCart,
                    shippingFee: shopConstant.shippingFee,
                    sum: cleanedSum,
                },
            },
        );
    }
}
