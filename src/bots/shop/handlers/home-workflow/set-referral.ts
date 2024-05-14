import { Injectable } from '@nestjs/common';
import { instanceToInstance } from 'class-transformer';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { Customer } from 'src/database/models/customer';
import { TcommandParser } from 'src/infrastructures/tcommand-parser';
import { ReferralPartnerRepository } from 'src/database/repositories/referral-partner-repository';
import { ShopRepository } from 'src/database/repositories/shop-repository';

@Injectable()
export class ShopHomeWorkflowSetReferralHandler {
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private referralPartnerRepository: ReferralPartnerRepository;
    private shopRepository: ShopRepository;

    public constructor(
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        referralPartnerRepository: ReferralPartnerRepository,
        shopRepository: ShopRepository,
    ) {
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.referralPartnerRepository = referralPartnerRepository;
        this.shopRepository = shopRepository;
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async handle(
        requestContext: RequestContext<Customer>,
        tcommandArgs: TcommandParser.TcommandArgs,
    ): Promise<void> {
        const customer = instanceToInstance(requestContext.user);
        if (typeof tcommandArgs?.data.referral !== 'undefined') {
            if (tcommandArgs.data.referral === 'null') {
                customer.referral = null;
            } else {
                const referralPartner =
                    await this.referralPartnerRepository.getReferralPartner(
                        tcommandArgs.data.referral,
                        requestContext.user.shop,
                        requestContext.poolClient,
                    );
                if (referralPartner !== null) {
                    customer.referral = tcommandArgs.data.referral;
                }
            }
        }

        const main = (
            await this.shopRepository.getShopForce(
                requestContext.user.shop,
                requestContext.poolClient,
            )
        ).mainDescription;

        customer.data = { state: 'home' };
        await this.customerRepository.updateCustomer(
            customer,
            requestContext.poolClient,
        );
        await this.frontend.sendActionMessage(
            requestContext.user.tid,
            'home-workflow/set-referral',
            { context: { description: main } },
        );
    }
}
