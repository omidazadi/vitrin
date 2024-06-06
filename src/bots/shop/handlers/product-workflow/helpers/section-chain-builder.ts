import { Injectable } from '@nestjs/common';
import { ShopCustomer } from 'src/bots/shop/user-builder';
import { Section } from 'src/database/models/section';
import { SectionRepository } from 'src/database/repositories/section-repository';
import { RequestContext } from 'src/infrastructures/context/request-context';

@Injectable()
export class ShopProductWorkflowSectionChainBuilderHelper {
    private sectionRepository: SectionRepository;

    public constructor(sectionRepository: SectionRepository) {
        this.sectionRepository = sectionRepository;
    }

    public async buildSectionChain(
        requestContext: RequestContext<ShopCustomer>,
        sectionName: string,
    ): Promise<Array<Section>> {
        let section = await this.sectionRepository.getSection(
            sectionName,
            requestContext.user.shop.name,
            requestContext.poolClient,
        );
        if (section === null) {
            throw new Error('Inconsistent section chain detected.');
        }

        let sectionChain: Array<Section> = [section];
        while (section !== null && section.parent !== null) {
            section = await this.sectionRepository.getSection(
                section.parent,
                requestContext.user.shop.name,
                requestContext.poolClient,
            );
            if (section === null) {
                throw new Error('Inconsistent section chain detected.');
            }

            sectionChain.push(section);
        }

        sectionChain = sectionChain.reverse();
        return sectionChain;
    }
}
