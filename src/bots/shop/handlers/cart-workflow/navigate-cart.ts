import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { instanceToInstance } from 'class-transformer';
import { OptionRepository } from 'src/database/repositories/option-repository';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VarietyRepository } from 'src/database/repositories/variety-repository';
import { CartItemRepository } from 'src/database/repositories/cart-item-repository';
import { CartItem } from 'src/database/models/cart-item';
import { ProductRepository } from 'src/database/repositories/product-repository';
import { Product } from 'src/database/models/product';
import { shopConstant } from '../../constants/shop-constant';
import { OptionVarietyRepository } from 'src/database/repositories/option-variety-repository';
import { Option } from 'src/database/models/option';
import { Variety } from 'src/database/models/variety';
import { CustomerRepository } from 'src/database/repositories/customer-repository';

@Injectable()
export class ShopCartWorkflowNavigateCartHandler {
    private frontend: HydratedFrontend;
    private productRepository: ProductRepository;
    private optionRepository: OptionRepository;
    private varietyRepository: VarietyRepository;
    private optionVarietyRepository: OptionVarietyRepository;
    private cartItemRepository: CartItemRepository;
    private customerRepository: CustomerRepository;

    public constructor(
        frontend: HydratedFrontend,
        productRepository: ProductRepository,
        optionRepository: OptionRepository,
        varietyRepository: VarietyRepository,
        optionVarietyRepository: OptionVarietyRepository,
        cartItemRepository: CartItemRepository,
        customerRepository: CustomerRepository,
    ) {
        this.frontend = frontend;
        this.productRepository = productRepository;
        this.optionRepository = optionRepository;
        this.varietyRepository = varietyRepository;
        this.optionVarietyRepository = optionVarietyRepository;
        this.cartItemRepository = cartItemRepository;
        this.customerRepository = customerRepository;
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
        const hydratedCart: Array<
            [
                CartItem,
                Variety,
                Array<{
                    option: Option;
                    value: string;
                }>,
                Product,
            ]
        > = [];
        let sum = shopConstant.shippingFee;
        for (const cartItem of cart) {
            const variety = (await this.varietyRepository.getVariety(
                cartItem.variety,
                cartItem.product,
                cartItem.shop,
                requestContext.poolClient,
            ))!;
            const optionVarieties =
                await this.optionVarietyRepository.getVarietyOptionVarieties(
                    variety.name,
                    variety.product,
                    variety.shop,
                    requestContext.poolClient,
                );
            const hydratedOptionValues: Array<{
                option: Option;
                value: string;
            }> = [];
            for (const optionVariety of optionVarieties) {
                const option = (await this.optionRepository.getOption(
                    optionVariety.option,
                    optionVariety.product,
                    optionVariety.shop,
                    requestContext.poolClient,
                ))!;
                hydratedOptionValues.push({
                    option: option,
                    value: optionVariety.value,
                });
            }
            const product = (await this.productRepository.getProduct(
                cartItem.product,
                cartItem.shop,
                requestContext.poolClient,
            ))!;
            sum += variety.price;
            hydratedCart.push([
                cartItem,
                variety,
                hydratedOptionValues,
                product,
            ]);
        }

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
