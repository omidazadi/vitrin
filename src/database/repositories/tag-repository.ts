import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Tag } from '../models/tag';

@Injectable()
export class TagRepository {
    public async createTag(
        name: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Tag> {
        const result = await poolClient.query(
            `
            INSERT INTO
            tag (name, shop)
            VALUES
                ($1, $2)
            RETURNING *
            `,
            [name, shop],
        );

        return this.bake(result.rows[0]);
    }

    public async getAllTags(
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<Tag>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM tag
            WHERE
                shop = $1
            `,
            [shop],
        );

        return result.rows.map((row) => this.bake(row));
    }

    public async deleteTag(
        name: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM tag
            WHERE
                name = $1
                    AND
                shop = $2
            `,
            [name, shop],
        );
    }

    private bake(row: any): Tag {
        return new Tag(row.name, row.shop);
    }
}
