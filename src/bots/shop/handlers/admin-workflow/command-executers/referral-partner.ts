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

@Injectable()
export class ShopAdminWorkflowReferralPartnerCommandExecuter {
    private grammyBot: GrammyBot;
    private frontend: HydratedFrontend;
    private referralPartnerRepository: ReferralPartnerRepository;
    private visitorRepository: VisitorRepository;

    public constructor(
        grammyBot: GrammyBot,
        frontend: HydratedFrontend,
        referralPartnerRepository: ReferralPartnerRepository,
        visitorRepository: VisitorRepository,
    ) {
        this.grammyBot = grammyBot;
        this.frontend = frontend;
        this.referralPartnerRepository = referralPartnerRepository;
        this.visitorRepository = visitorRepository;
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
