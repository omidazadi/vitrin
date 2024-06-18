import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { instanceToInstance } from 'class-transformer';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { CartItemRepository } from 'src/database/repositories/cart-item-repository';
import { shopConstant } from '../../constants/shop-constant';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { ShopCartWorkflowCartHyderaterHelper } from './helpers/cart-hyderater';

@Injectable()
export class ShopCartWorkflowNavigateCartHandler {
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

        const [hydratedCart, sum] = await this.cartHyderaterHelper.hyderateCart(
            requestContext,
            cart,
        );

        customer.data = { state: 'cart' };
        await this.customerRepository.updateCustomer(
            customer,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'cart-workflow/navigate-cart',
            {
                context: {
                    cart: hydratedCart,
                    shippingFee: shopConstant.shippingFee,
                    sum: sum,
                },
            },
        );
    }
}
