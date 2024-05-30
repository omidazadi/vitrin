import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { TagSection } from '../models/tag-section';

@Injectable()
export class TagSectionRepository {
    public async createTagSection(
        tag: string,
        section: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<TagSection> {
        const result = await poolClient.query(
            `
            INSERT INTO
            tag_section (tag, section, shop)
            VALUES
                ($1, $2, $3)
            RETURNING *
            `,
            [tag, section, shop],
        );

        return this.bake(result.rows[0]);
    }

    public async deleteTagSection(
        tag: string,
        section: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM tag_section
            WHERE
                tag = $1
                    AND
                section = $2
                    AND
                shop = $3
            `,
            [tag, section, shop],
        );
    }

    private bake(row: any): TagSection {
        return new TagSection(row.tag, row.section, row.shop);
    }
}
