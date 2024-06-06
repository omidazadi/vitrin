import { Inject, Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { ShopCustomer } from '../../user-builder';

@Injectable()
export class ShopInformationWorkflowFillEntryHandler {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private buttonTexts: any;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        @Inject('BUTTON_TEXTS') buttonTexts: any,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.buttonTexts = buttonTexts;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<void> {
        if (requestContext.telegramContext.text === null) {
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'common/unknown-error',
            );
            return;
        }

        const customer = instanceToInstance(requestContext.user.customer);
        if (customer.data.entry === 'firstName') {
            customer.data.entry = 'lastName';
            if (
                customer.firstName === null ||
                requestContext.telegramContext.text !==
                    this.buttonTexts.state.information_questionnaire
                        .do_not_change
            ) {
                customer.data.firstName = requestContext.telegramContext.text;
            } else {
                customer.data.firstName = customer.firstName;
            }
        } else if (customer.data.entry === 'lastName') {
            customer.data.entry = 'address';
            if (
                customer.lastName === null ||
                requestContext.telegramContext.text !==
                    this.buttonTexts.state.information_questionnaire
                        .do_not_change
            ) {
                customer.data.lastName = requestContext.telegramContext.text;
            } else {
                customer.data.lastName = customer.lastName;
            }
        } else if (customer.data.entry === 'address') {
            customer.data.entry = 'zipCode';
            if (
                customer.address === null ||
                requestContext.telegramContext.text !==
                    this.buttonTexts.state.information_questionnaire
                        .do_not_change
            ) {
                customer.data.address = requestContext.telegramContext.text;
            } else {
                customer.data.address = customer.address;
            }
        } else if (customer.data.entry === 'zipCode') {
            if (
                customer.zipCode === null ||
                requestContext.telegramContext.text !==
                    this.buttonTexts.state.information_questionnaire
                        .do_not_change
            ) {
                customer.data.zipCode = requestContext.telegramContext.text;
            } else {
                customer.data.zipCode = customer.zipCode;
            }

            customer.firstName = customer.data.firstName;
            customer.lastName = customer.data.lastName;
            customer.address = customer.data.address;
            customer.zipCode = customer.data.zipCode;
            customer.data.state = 'information-document';
            delete customer.data.entry;
            delete customer.data.firstName;
            delete customer.data.lastName;
            delete customer.data.address;
            delete customer.data.zipCode;
        }

        await this.customerRepository.updateCustomer(
            customer,
            requestContext.poolClient,
        );
        if (customer.data.state === 'information-document') {
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'information-workflow/fill-entry',
                {
                    context: {
                        scenario: 'document:land',
                        customer: customer,
                    },
                },
            );
            return;
        } else {
            await this.frontend.sendActionMessage(
                requestContext.user.customer.tid,
                'information-workflow/fill-entry',
                {
                    context: {
                        scenario: 'questionnaire:land',
                        entry: customer.data.entry,
                        customer: customer,
                    },
                },
            );
            return;
        }
    }
}
