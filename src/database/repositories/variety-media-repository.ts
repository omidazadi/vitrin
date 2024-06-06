import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { VarietyMedia } from '../models/variety-media';

@Injectable()
export class VarietyMediaRepository {
    public async createVarietyMedia(
        name: string,
        variety: string,
        product: string,
        fileTid: string,
        isMain: boolean,
        shop: string,
        poolClient: PoolClient,
    ): Promise<VarietyMedia> {
        const result = await poolClient.query(
            `
            INSERT INTO
            variety_media (
                name,
                variety,
                product,
                file_tid,
                is_main,
                shop
            )
            VALUES
                ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [name, variety, product, fileTid, isMain, shop],
        );

        return this.bake(result.rows[0]);
    }

    public async getVarietyMedia(
        name: string,
        variety: string,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<VarietyMedia | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM variety_media
            WHERE
                name = $1
                    AND
                variety = $2
                    AND
                product = $3
                    AND
                shop = $4
            `,
            [name, variety, product, shop],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    public async getAllVarietyMedia(
        variety: string,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<VarietyMedia>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM variety_media
            WHERE
                variety = $1
                    AND
                product = $2
                    AND
                shop = $3
            `,
            [variety, product, shop],
        );

        return result.rows.map((row) => this.bake(row));
    }

    public async deleteVarietyMedia(
        name: string,
        variety: string,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM variety_media
            WHERE
                name = $1
                    AND
                variety = $2
                    AND
                product = $3
                    AND
                shop = $4
            `,
            [name, variety, product, shop],
        );
    }

    public async deleteAllVarietyMedia(
        variety: string,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM variety_media
            WHERE
                variety = $1
                    AND
                product = $2
                    AND
                shop = $3
            `,
            [variety, product, shop],
        );
    }

    private bake(row: any): VarietyMedia {
        return new VarietyMedia(
            row.name,
            row.variety,
            row.product,
            row.file_tid,
            row.is_main,
            row.shop,
        );
    }
}
