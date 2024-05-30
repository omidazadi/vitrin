import { Injectable } from '@nestjs/common';
import { Section } from 'src/database/models/section';
import { SectionRepository } from 'src/database/repositories/section-repository';
import { allowedMedia } from 'src/infrastructures/allowed-media';
import { RequestContext } from 'src/infrastructures/context/request-context';
import { HydratedFrontend } from 'src/infrastructures/frontend/hydrated-frontend';
import { ShopAdminWorkflowSectionTagCommandExecuter } from './tag';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { ExpectedError } from 'src/infrastructures/errors/expected-error';

@Injectable()
export class ShopAdminWorkflowSectionCommandExecuter {
    private frontend: HydratedFrontend;
    private tagCommandExecuter: ShopAdminWorkflowSectionTagCommandExecuter;
    private sectionRepository: SectionRepository;

    public constructor(
        frontend: HydratedFrontend,
        tagCommandExecuter: ShopAdminWorkflowSectionTagCommandExecuter,
        sectionRepository: SectionRepository,
    ) {
        this.frontend = frontend;
        this.tagCommandExecuter = tagCommandExecuter;
        this.sectionRepository = sectionRepository;
    }

    public async handle(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ): Promise<void> {
        if (tokens.length === 0) {
            await this.error(requestContext);
        } else if (tokens[0] === 'tag') {
            await this.tagCommandExecuter.handle(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'create') {
            await this.createSection(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'update') {
            await this.updateSection(
                requestContext,
                tokens.slice(1, tokens.length),
            );
        } else if (tokens[0] === 'show') {
            if (tokens.length >= 2 && tokens[1] === 'all') {
                await this.showAllSections(
                    requestContext,
                    tokens.slice(2, tokens.length),
                );
            } else {
                await this.showSection(
                    requestContext,
                    tokens.slice(1, tokens.length),
                );
            }
        } else if (tokens[0] === 'delete') {
            await this.deleteSection(
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
    public async createSection(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 2) {
            await this.error(requestContext);
            return;
        }

        let parent: Section | null = null;
        if (tokens[1] !== 'null') {
            parent = await this.sectionRepository.getSection(
                tokens[1],
                requestContext.user.shop.name,
                requestContext.poolClient,
            );
            if (parent === null) {
                await this.error(requestContext);
                return;
            }
        }

        let childSections = await this.sectionRepository.getChildSections(
            parent === null ? null : parent.name,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (parent === null && childSections.length > 0) {
            if (parent === null) {
                await this.error(requestContext);
                return;
            }
        }
        for (const childSection of childSections) {
            childSection.rank += 1;
            await this.sectionRepository.updateSection(
                childSection,
                requestContext.poolClient,
            );
        }

        const section = await this.sectionRepository.createSection(
            tokens[0],
            tokens[0],
            tokens[0],
            null,
            parent === null ? null : parent.name,
            1,
            true,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                photo: section.fileTid === null ? undefined : section.fileTid,
                context: {
                    scenario: 'plain',
                    message: await this.makeSectionInfo(
                        requestContext,
                        section,
                    ),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'allowed',
        video: 'prohibited',
    })
    public async updateSection(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 5) {
            await this.error(requestContext);
            return;
        }

        if (tokens[4] !== 'true' && tokens[4] !== 'false') {
            await this.error(requestContext);
            return;
        }

        let section = await this.sectionRepository.getSection(
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (section === null) {
            await this.error(requestContext);
            return;
        }

        let childSections = await this.sectionRepository.getChildSections(
            section.parent,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (
            parseInt(tokens[3]) < 1 ||
            parseInt(tokens[3]) > childSections.length
        ) {
            await this.error(requestContext);
            return;
        }

        for (const childSection of childSections) {
            if (childSection.name !== section.name) {
                let flag = false;
                if (
                    childSection.rank > section.rank &&
                    childSection.rank <= parseInt(tokens[3])
                ) {
                    flag = true;
                    childSection.rank -= 1;
                } else if (
                    childSection.rank < section.rank &&
                    childSection.rank >= parseInt(tokens[3])
                ) {
                    flag = true;
                    childSection.rank += 1;
                }
                if (flag === true) {
                    await this.sectionRepository.updateSection(
                        childSection,
                        requestContext.poolClient,
                    );
                }
            }
        }

        section.fullName = tokens[1];
        section.description = tokens[2];
        section.fileTid = requestContext.telegramContext.photo;
        section.rank = parseInt(tokens[3]);
        section.newLine = tokens[4] === 'true' ? true : false;
        await this.sectionRepository.updateSection(
            section,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                photo: section.fileTid === null ? undefined : section.fileTid,
                context: {
                    scenario: 'plain',
                    message: await this.makeSectionInfo(
                        requestContext,
                        section,
                    ),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showAllSections(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 0) {
            await this.error(requestContext);
            return;
        }

        const allSections = await this.sectionRepository.getAllSections(
            requestContext.user.shop.name,
            requestContext.poolClient,
        );

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                context: {
                    scenario: 'plain',
                    message: allSections
                        .map((section) => section.name)
                        .join(','),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async showSection(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        let section = await this.sectionRepository.getSection(
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (section === null) {
            await this.error(requestContext);
            return;
        }

        await this.frontend.sendActionMessage(
            requestContext.user.customer.tid,
            'admin-workflow/command',
            {
                photo: section.fileTid === null ? undefined : section.fileTid,
                context: {
                    scenario: 'plain',
                    message: await this.makeSectionInfo(
                        requestContext,
                        section,
                    ),
                },
            },
        );
    }

    @allowedMedia({
        photo: 'prohibited',
        video: 'prohibited',
    })
    public async deleteSection(
        requestContext: RequestContext<ShopCustomer>,
        tokens: Array<string>,
    ) {
        if (tokens.length !== 1) {
            await this.error(requestContext);
            return;
        }

        let section = await this.sectionRepository.getSection(
            tokens[0],
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (section === null) {
            await this.error(requestContext);
            return;
        }

        let childSections = await this.sectionRepository.getChildSections(
            section.parent,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        for (const childSection of childSections) {
            if (childSection.rank > section.rank) {
                childSection.rank -= 1;
                await this.sectionRepository.updateSection(
                    childSection,
                    requestContext.poolClient,
                );
            }
        }

        await this.sectionRepository.deleteSection(
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

    private async makeSectionInfo(
        requestContext: RequestContext<ShopCustomer>,
        section: Section,
    ): Promise<string> {
        const childSections = await this.sectionRepository.getChildSections(
            section.name,
            section.shop,
            requestContext.poolClient,
        );
        const tags = await this.sectionRepository.getSectionTags(
            section.name,
            section.shop,
            requestContext.poolClient,
        );
        return `Name:${section.name}\n\nFull Name:${section.fullName}\n\nDescription:${section.description}\n\nParent:${section.parent}\n\nChildren:${childSections.map((section) => section.name).join(',')}\n\nRank:${section.rank}\n\nNew Line:${section.newLine}\n\nTags:${tags.map((tag) => tag.name).join(',')}`;
    }
}
