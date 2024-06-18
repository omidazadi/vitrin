import { Bot as GrammyBot } from 'grammy';
import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { ReferralPartner } from 'src/database/models/referral-partner';
import { ReferralPartnerRepository } from 'src/database/repositories/referral-partner-repository';
import { VisitorRepository } from 'src/database/repositories/visitor-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { PurchaseRepository } from 'src/database/repositories/purchase-repository';
import { CustomerRepository } from 'src/database/repositories/customer-repository';
import { ReferralDepositStatementRepository } from 'src/database/repositories/referral-deposit-statement';
import { ShopCartWorkflowUidGeneratorHelper } from '../../cart-workflow/helpers/uid-generator';
import { PaymentRepository } from 'src/database/repositories/payment-repository';

@Injectable()
export class ShopAdminWorkflowReferralPartnerCommandExecuter {
    private grammyBot: GrammyBot;
    private frontend: HydratedFrontend;
    private customerRepository: CustomerRepository;
    private paymentRepository: PaymentRepository;
    private purchaseRepository: PurchaseRepository;
    private referralPartnerRepository: ReferralPartnerRepository;
    private referralDepositStatementRepository: ReferralDepositStatementRepository;
    private visitorRepository: VisitorRepository;
    private cartWorkflowUidGeneratorHelper: ShopCartWorkflowUidGeneratorHelper;

    public constructor(
        grammyBot: GrammyBot,
        frontend: HydratedFrontend,
        customerRepository: CustomerRepository,
        paymentRepository: PaymentRepository,
        purchaseRepository: PurchaseRepository,
        referralPartnerRepository: ReferralPartnerRepository,
        referralDepositStatementRepository: ReferralDepositStatementRepository,
        visitorRepository: VisitorRepository,
        cartWorkflowUidGeneratorHelper: ShopCartWorkflowUidGeneratorHelper,
    ) {
        this.grammyBot = grammyBot;
        this.frontend = frontend;
        this.customerRepository = customerRepository;
        this.paymentRepository = paymentRepository;
        this.purchaseRepository = purchaseRepository;
        this.referralPartnerRepository = referralPartnerRepository;
        this.referralDepositStatementRepository =
            referralDepositStatementRepository;
        this.visitorRepository = visitorRepository;
        this.cartWorkflowUidGeneratorHelper = cartWorkflowUidGeneratorHelper;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'create') {
            await this.createReferralPartner(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'update') {
            await this.updateReferralPartner(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'show') {
            if (tokens.length >= 2 && tokens[1] === 'all') {
                await this.showAllReferralPartners(
                    requestContext,
                    tokens.slice(2, tokens.length),
                );
            } else {
                await this.showReferralPartner(
                    requestContext,
                    tokens.slice(1, tokens.length),
                );
            }
        } else if (tokens[0] === 'delete') {
            await this.deleteReferralPartner(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'link') {
            await this.getReferralPartnerLink(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'statistics') {
            await this.showReferralPartnerStatistics(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'pay') {
            await this.payReferralPartner(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else {
            await this.error(requestContext);
        }
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async createReferralPartner(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 2) {
            await this.error(requestContext);
            return;
        }

        const visitor = await this.visitorRepository.getVisitorByTid(
            tokens[1],
            requestContext.poolClient,
        );
        if (visitor === null) {
            await this.error(requestContext);
            return;
        }
        const referralPartner =
            await this.referralPartnerRepository.createReferralPartner(
                tokens[0],
                visitor.id,
                0,
                null,
                requestContext.user.shop.name,
                requestContext.poolClient,
            );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: await this.makeReferralPartnerInfo(
                        requestContext,
                        referralPartner,
                    ),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async updateReferralPartner(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 2 && tokens.length !== 3) {
            await this.error(requestContext);
            return;
        }

        const referralPartner =
            await this.referralPartnerRepository.getReferralPartner(
                tokens[0],
                requestContext.user.shop.name,
                requestContext.poolClient,
            );
        if (referralPartner === null) {
            await this.error(requestContext);
            return;
        }

        referralPartner.fee = Number(tokens[1]);
        referralPartner.paymentData = tokens.length === 2 ? null : tokens[2];
        await this.referralPartnerRepository.updateReferralPartner(
            referralPartner,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: await this.makeReferralPartnerInfo(
                        requestContext,
                        referralPartner,
                    ),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showAllReferralPartners(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 0) {
            await this.error(requestContext);
            return;
        }

        const referralPartners =
            await this.referralPartnerRepository.getAllReferralPartners(
                requestContext.user.shop.name,
                requestContext.poolClient,
            );
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: referralPartners
                        .map((referralPartner) => referralPartner.name)
                        .join(','),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showReferralPartner(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        const referralPartner =
            await this.referralPartnerRepository.getReferralPartner(
                tokens[0],
                requestContext.user.shop.name,
                requestContext.poolClient,
            );
        if (referralPartner === null) {
            await this.error(requestContext);
            return;
        }

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: await this.makeReferralPartnerInfo(
                        requestContext,
                        referralPartner,
                    ),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async deleteReferralPartner(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        await this.referralPartnerRepository.deleteReferralPartner(
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            { context: { scenario: 'done' } },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async getReferralPartnerLink(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        const referralPartner =
            await this.referralPartnerRepository.getReferralPartner(
                tokens[0],
                requestContext.user.shop.name,
                requestContext.poolClient,
            );
        if (referralPartner === null) {
            await this.error(requestContext);
            return;
        }

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: `https://telegram.me/${this.grammyBot.botInfo.username}?start=0-referral=${referralPartner.name}-landing=root`,
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showReferralPartnerStatistics(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        const referralPartner =
            await this.referralPartnerRepository.getReferralPartner(
                tokens[0],
                requestContext.user.shop.name,
                requestContext.poolClient,
            );
        if (referralPartner === null) {
            await this.error(requestContext);
            return;
        }

        const totalCustomers =
            await this.customerRepository.getNumberOfReferralCustomers(
                referralPartner.name,
                referralPartner.shop,
                requestContext.poolClient,
            );
        const totalPurchases =
            await this.purchaseRepository.getTotalReferralPurchaseCount(
                referralPartner.name,
                referralPartner.shop,
                requestContext.poolClient,
            );
        const totalFee =
            await this.purchaseRepository.getTotalReferralPurchaseSum(
                referralPartner.name,
                referralPartner.shop,
                requestContext.poolClient,
            );
        const currentPurchases =
            await this.purchaseRepository.getCurrentReferralPurchaseCount(
                referralPartner.name,
                referralPartner.shop,
                requestContext.poolClient,
            );
        const currentFee =
            await this.purchaseRepository.getCurrentReferralPurchaseSum(
                referralPartner.name,
                referralPartner.shop,
                requestContext.poolClient,
            );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'helpers/referral-partner-statistics',
            {
                context: {
                    referral: referralPartner,
                    totalCustomers: totalCustomers,
                    totalPurchases: totalPurchases,
                    totalFee: totalFee,
                    currentPurchases: currentPurchases,
                    currentFee: currentFee,
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async payReferralPartner(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        const referralPartner =
            await this.referralPartnerRepository.getReferralPartner(
                tokens[0],
                requestContext.user.shop.name,
                requestContext.poolClient,
            );
        if (referralPartner === null) {
            await this.error(requestContext);
            return;
        }

        const currentPurchases =
            await this.purchaseRepository.getCurrentDeliveredReferralPurchases(
                referralPartner.name,
                referralPartner.shop,
                requestContext.poolClient,
            );

        let sum = 0;
        for (const purchase of currentPurchases) {
            sum += purchase.referralFee;
        }

        const payment = await this.paymentRepository.createPayment(
            'PA' + this.cartWorkflowUidGeneratorHelper.generateUid(),
            'to-referral',
            'manual',
            'accepted',
            sum,
            new Date(),
            requestContext.poolClient,
        );
        const referralDepositStatement =
            await this.referralDepositStatementRepository.createReferralDepositStatement(
                'RDS-' + this.cartWorkflowUidGeneratorHelper.generateUid(),
                payment.uid,
                referralPartner.name,
                sum,
                new Date(),
                referralPartner.shop,
                requestContext.poolClient,
            );

        for (const purchase of currentPurchases) {
            purchase.referralDepositStatementUid = referralDepositStatement.uid;
            await this.purchaseRepository.updatePurchase(
                purchase,
                requestContext.poolClient,
            );
        }

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'helpers/referral-deposit-statement',
            {
                context: {
                    referral: referralPartner,
                    depositStatement: referralDepositStatement,
                    currentPurchases: currentPurchases.length,
                    dateString:
                        referralDepositStatement.createdAt.toUTCString(),
                },
            },
        );
    }

    private async error(
        requestContext: RequestContext<ShopCustomer>,
    ): Promise<never> {
        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            { context: { scenario: 'error' } },
        );
        throw new ExpectedError();
    }

    private async makeReferralPartnerInfo(
        requestContext: RequestContext<ShopCustomer>,
        referralPartner: ReferralPartner,
    ): Promise<string> {
        return `Name:${referralPartner.name}\n\nFee:${referralPartner.fee}\n\nPayment Data:${referralPartner.paymentData}`;
    }
}
