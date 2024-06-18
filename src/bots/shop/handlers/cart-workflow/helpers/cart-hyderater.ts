import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ShopCustomer } from '../../../user-builder';
import { CartItem } from 'src/database/models/cart-item';
import { Variety } from 'src/database/models/variety';
import { Option } from 'src/database/models/option';
import { Product } from 'src/database/models/product';
import { shopConstant } from 'src/bots/shop/constants/shop-constant';
import { OptionRepository } from 'src/database/repositories/option-repository';
import { OptionVarietyRepository } from 'src/database/repositories/option-variety-repository';
import { ProductRepository } from 'src/database/repositories/product-repository';
import { VarietyRepository } from 'src/database/repositories/variety-repository';

@Injectable()
export class ShopCartWorkflowCartHyderaterHelper {
    private productRepository: ProductRepository;
    private optionRepository: OptionRepository;
    private varietyRepository: VarietyRepository;
    private optionVarietyRepository: OptionVarietyRepository;

    public constructor(
        productRepository: ProductRepository,
        optionRepository: OptionRepository,
        varietyRepository: VarietyRepository,
        optionVarietyRepository: OptionVarietyRepository,
    ) {
        this.productRepository = productRepository;
        this.optionRepository = optionRepository;
        this.varietyRepository = varietyRepository;
        this.optionVarietyRepository = optionVarietyRepository;
    }

    public async hyderateCart(
        requestContext: RequestContext<ShopCustomer>,
        cart: Array<CartItem>,
    ): Promise<
        [
            Array<
                [
                    CartItem,
                    Variety,
                    Array<{
                        option: Option;
                        value: string;
                    }>,
                    Product,
                    boolean,
                ]
            >,
            number,
        ]
    > {
        await this.varietyRepository.lockAllVarieties(
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        const varaieties = await this.varietyRepository.getCartVarieties(
            requestContext.user.customer.id,
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
                boolean,
            ]
        > = [];
        let sum = shopConstant.shippingFee;
        for (const cartItem of cart) {
            const variety = varaieties.find(
                (x) =>
                    x.name === cartItem.variety &&
                    x.product === cartItem.product &&
                    x.shop === cartItem.shop,
            )!;
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
            sum += variety.stock <= 0 ? 0 : variety.price;
            hydratedCart.push([
                cartItem,
                variety,
                hydratedOptionValues,
                product,
                variety.stock <= 0 ? false : true,
            ]);
            variety.stock -= 1;
        }

        return [hydratedCart, sum];
    }
}
