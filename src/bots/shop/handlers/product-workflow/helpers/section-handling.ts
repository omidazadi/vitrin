import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { Customer } from 'src/database/models/customer';
import { Section } from 'src/database/models/section';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { OptionRepository } from 'src/database/repositories/option-repository';
import { ProductRepository } from 'src/database/repositories/product-repository';
import { SectionRepository } from 'src/database/repositories/section-repository';
import { uxConstant } from 'src/infrastructures/constants/ux-constant';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { setTimeout } from 'timers/promises';

@Injectable()
export class ShopProductWorkflowSectionHandlingHelper {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private sectionRepository: SectionRepository;
    private productRepository: ProductRepository;
    private optionRepository: OptionRepository;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        sectionRepository: SectionRepository,
        productRepository: ProductRepository,
        optionRepository: OptionRepository,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.sectionRepository = sectionRepository;
        this.productRepository = productRepository;
        this.optionRepository = optionRepository;
    }

    public async sectionHandling(
        requestContext: RequestContext<ShopCustomer>,
        customer: Customer,
        action: string,
        sectionChain: Array<Section>,
    ): Promise<void> {
        const section = sectionChain[sectionChain.length - 1];
        const childSections = await this.sectionRepository.getChildSections(
            section.name,
            section.shop,
            requestContext.poolClient,
        );

        if (childSections.length === 0) {
            const products = await this.productRepository.getProductsBySections(
                sectionChain,
                requestContext.user.shop.name,
                requestContext.poolClient,
            );

            if (products.length === 0) {
                await this.frontend.sendActionMessage(
                    requestContext.user.customer.tid,
                    action,
                    { context: { scenario: 'product:error-no-product' } },
                );
                return;
            } else {
                const options = await this.optionRepository.getProductOptions(
                    products[0].name,
                    products[0].shop,
                    requestContext.poolClient,
                );
                const media =
                    await this.productRepository.getMainVarietyMediaOfProduct(
                        products[0].name,
                        [],
                        products[0].shop,
                        requestContext.poolClient,
                    );

                customer.data = {
                    state: 'product',
                    sections: sectionChain.map((section) => section.name),
                    currentProduct: products[0].name,
                };
                await this.customerRepository.updateCustomer(
                    customer,
                    requestContext.poolClient,
                );
                await this.frontend.sendActionMessage(
                    requestContext.user.customer.tid,
                    action,
                    {
                        album: media,
                        context: {
                            scenario: 'product:success',
                            product: products[0],
                            currentNumber: 1,
                            totalNumber: products.length,
                            options: options,
                        },
                    },
                );
                await setTimeout(uxConstant.consecutiveMessageDelay);
                await this.frontend.sendActionMessage(
                    requestContext.user.customer.tid,
                    action,
                    {
                        context: {
                            scenario: 'product:guide',
                            product: products[0],
                            currentNumber: 1,
                            totalNumber: products.length,
                            options: options,
                        },
                    },
                );
            }
        } else {
            const childSections = await this.sectionRepository.getChildSections(
                section.name,
                section.shop,
                requestContext.poolClient,
            );

            customer.data = {
                state: 'section',
                sections: sectionChain.map((section) => section.name),
            };
            await this.customerRepository.updateCustomer(
                customer,
                requestContext.poolClient,
            );
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                action,
                {
                    photo:
                        section.fileTid === null ? undefined : section.fileTid,
                    context: {
                        scenario: 'section:success',
                        section: section,
                        childSections: childSections,
                    },
                },
            );
        }
    }
}
