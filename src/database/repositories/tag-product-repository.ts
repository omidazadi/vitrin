import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { TagProduct } from '../models/tag-product';

@Injectable()
export class TagProductRepository {
    public async createTagProduct(
        tag: string,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<TagProduct> {
        const result = await poolClient.query(
            `
            INSERT INTO
            tag_product (tag, product, shop)
            VALUES
                ($1, $2, $3)
            RETURNING *
            `,
            [tag, product, shop],
        );

        return this.bake(result.rows[0]);
    }

    public async deleteTagProduct(
        tag: string,
        section: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM tag_product
            WHERE
                tag = $1
                    AND
                product = $2
                    AND
                shop = $3
            `,
            [tag, section, shop],
        );
    }

    private bake(row: any): TagProduct {
        return new TagProduct(row.tag, row.product, row.shop);
    }
}
