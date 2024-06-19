import { Injectable } from '@nestjs/common';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { ShopCustomer } from '../../user-builder';
import { instanceToInstance } from 'class-transformer';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { VarietyRepository } from 'src/database/repositories/variety-repository';
import { CartItemRepository } from 'src/database/repositories/cart-item-repository';
import { CartItem } from 'src/database/models/cart-item';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { ShopCartWorkflowCartHyderaterHelper } from './helpers/cart-hyderater';
import { PaymentRepository } from 'src/database/repositories/payment-repository';
import { PurchaseItemRepository } from 'src/database/repositories/purchase-item-repository';
import { PurchaseRepository } from 'src/database/repositories/purchase-repository';
import { shopConstant } from '../../constants/shop-constant';
import { ReferralPartnerRepository } from 'src/database/repositories/referral-partner-repository';
import { Variety } from 'src/database/models/variety';
import { OptionVarietyRepository } from 'src/database/repositories/option-variety-repository';
import { ProductRepository } from 'src/database/repositories/product-repository';
import { OptionRepository } from 'src/database/repositories/option-repository';
import { ShopCartWorkflowUidGeneratorHelper } from './helpers/uid-generator';
import { PurchaseItem } from 'src/database/models/purchase-item';
import { setTimeout } from 'timers/promises';
import { uxConstant } from 'src/infrastructures/constants/ux-constant';

@Injectable()
export class ShopCartWorkflowNavigateCheckoutHandler {
    private frontend: HydratedFrontend;
    private referralPartnerRepository: ReferralPartnerRepository;
    private productRepository: ProductRepository;
    private optionRepository: OptionRepository;
    private varietyRepository: VarietyRepository;
    private optionVarietyRepository: OptionVarietyRepository;
    private cartItemRepository: CartItemRepository;
    private customerRepository: CustomerRepository;
    private paymentRepository: PaymentRepository;
    private purchaseRepository: PurchaseRepository;
    private purchaseItemRepository: PurchaseItemRepository;
    private cartHyderaterHelper: ShopCartWorkflowCartHyderaterHelper;
    private uidGeneratorHelper: ShopCartWorkflowUidGeneratorHelper;

    public constructor(
        frontend: HydratedFrontend,
        referralPartnerRepository: ReferralPartnerRepository,
        productRepository: ProductRepository,
        optionRepository: OptionRepository,
        varietyRepository: VarietyRepository,
        optionVarietyRepository: OptionVarietyRepository,
        cartItemRepository: CartItemRepository,
        customerRepository: CustomerRepository,
        paymentRepository: PaymentRepository,
        purchaseRepository: PurchaseRepository,
        purchaseItemRepository: PurchaseItemRepository,
        cartHyderaterHelper: ShopCartWorkflowCartHyderaterHelper,
        uidGeneratorHelper: ShopCartWorkflowUidGeneratorHelper,
    ) {
        this.frontend = frontend;
        this.referralPartnerRepository = referralPartnerRepository;
        this.productRepository = productRepository;
        this.optionRepository = optionRepository;
        this.varietyRepository = varietyRepository;
        this.optionVarietyRepository = optionVarietyRepository;
        this.cartItemRepository = cartItemRepository;
        this.customerRepository = customerRepository;
        this.paymentRepository = paymentRepository;
        this.purchaseRepository = purchaseRepository;
        this.purchaseItemRepository = purchaseItemRepository;
        this.cartHyderaterHelper = cartHyderaterHelper;
        this.uidGeneratorHelper = uidGeneratorHelper;
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
        if (cart.length === 0) {
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'common/unknown-error',
            );
            return;
        }

        const varaieties = await this.varietyRepository.getCartVarietiesLocking(
            customer.id,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        const unavailables: Array<CartItem> = [];
        let sum = shopConstant.shippingFee;
        for (const cartItem of cart) {
            const variety = varaieties.find(
                (x) =>
                    x.name === cartItem.variety &&
                    x.product === cartItem.product &&
                    x.shop === cartItem.shop,
            )!;
            if (variety.stock === 0) {
                unavailables.push(cartItem);
            } else {
                variety.stock -= 1;
                sum += variety.price;
            }
        }

        if (unavailables.length > 0) {
            const [hyderatedUnavailables, sum] =
                await this.cartHyderaterHelper.hyderateCart(
                    requestContext,
                    unavailables,
                );
            customer.data = { state: 'missing-items' };
            await this.customerRepository.updateCustomer(
                customer,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'cart-workflow/navigate-checkout',
                {
                    forcedType: 'keyboard',
                    context: {
                        scenario: 'missing-items:land',
                        cart: hyderatedUnavailables,
                    },
                },
            );
            return;
        }

        const referralPartner =
            customer.referral === null
                ? null
                : await this.referralPartnerRepository.getReferralPartner(
                      customer.referral,
                      requestContext.user.shop.name,
                      requestContext.poolClient,
                  );
        const payment = await this.paymentRepository.createPayment(
            'PA-' + this.uidGeneratorHelper.generateUid(),
            'to-shop',
            'manual',
            'pending',
            sum,
            new Date(),
            requestContext.poolClient,
        );
        const purchase = await this.purchaseRepository.createPurchase(
            'PU-' + this.uidGeneratorHelper.generateUid(),
            payment.uid,
            null,
            null,
            customer.id,
            customer.firstName!,
            customer.lastName!,
            customer.phoneNumber!,
            customer.address!,
            customer.zipCode!,
            'pending',
            null,
            customer.referral,
            referralPartner === null
                ? 0
                : Math.floor(
                      (referralPartner.fee * (sum - shopConstant.shippingFee)) /
                          100,
                  ),
            null,
            shopConstant.shippingFee,
            sum,
            new Date(),
            requestContext.user.shop.name,
            requestContext.poolClient,
        );

        const purchaseItems: Array<PurchaseItem> = [];
        for (const cartItem of cart) {
            const variety = varaieties.find(
                (x) =>
                    x.name === cartItem.variety &&
                    x.product === cartItem.product &&
                    x.shop === cartItem.shop,
            )!;
            purchaseItems.push(
                await this.purchaseItemRepository.createPurchaseItem(
                    purchase.uid,
                    variety.product,
                    variety.name,
                    await this.createItemFullName(requestContext, variety),
                    variety.price,
                    new Date(),
                    requestContext.user.shop.name,
                    requestContext.poolClient,
                ),
            );
        }

        for (const variety of varaieties) {
            await this.varietyRepository.updateVariety(
                variety,
                requestContext.poolClient,
            );
        }

        customer.data = { state: 'checkout', purchaseUid: purchase.uid };
        await this.customerRepository.updateCustomer(
            customer,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'cart-workflow/navigate-checkout',
            {
                context: {
                    scenario: 'checkout:land',
                },
            },
        );
        await setTimeout(uxConstant.consecutiveMessageDelay);
        const customerReceiptTid = await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'helpers/customer-receipt',
            {
                context: {
                    purchase: purchase,
                    purchaseItems: purchaseItems,
                    dateString: purchase.createdAt.toUTCString(),
                },
            },
        );
        purchase.customerReceiptTid = customerReceiptTid;
        await this.purchaseRepository.updatePurchase(
            purchase,
            requestContext.poolClient,
        );

        return;
    }

    private async createItemFullName(
        requestContext: RequestContext<ShopCustomer>,
        variety: Variety,
    ): Promise<string> {
        let itemFullName = '';
        const product = (await this.productRepository.getProduct(
            variety.product,
            variety.shop,
            requestContext.poolClient,
        ))!;
        itemFullName += product.fullName;
        const optionVarieties =
            await this.optionVarietyRepository.getVarietyOptionVarieties(
                variety.name,
                variety.product,
                variety.shop,
                requestContext.poolClient,
            );
        for (const optionVariety of optionVarieties) {
            const option = (await this.optionRepository.getOption(
                optionVariety.option,
                optionVariety.product,
                optionVariety.shop,
                requestContext.poolClient,
            ))!;
            itemFullName += ' ' + option.fullName + ' ' + optionVariety.value;
        }
        return itemFullName;
    }
}
