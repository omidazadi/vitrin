import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { OptionVariety } from '../models/option-variety';

@Injectable()
export class OptionVarietyRepository {
    public async createOptionVariety(
        value: string,
        option: string,
        variety: string,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<OptionVariety> {
        const result = await poolClient.query(
            `
            INSERT INTO
            option_variety (
                value,
                option,
                variety,
                product,
                shop
            )
            VALUES
                ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [value, option, variety, product, shop],
        );

        return this.bake(result.rows[0]);
    }

    public async updateOptionVariety(
        OptionVariety: OptionVariety,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            UPDATE option_variety
            SET
                value = $1
            WHERE
                option = $2
                    AND
                variety = $3
                    AND
                product = $4
                    AND
                shop = $5
            `,
            [
                OptionVariety.value,
                OptionVariety.option,
                OptionVariety.variety,
                OptionVariety.product,
                OptionVariety.shop,
            ],
        );
    }

    public async getOptionVariety(
        option: string,
        variety: string,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<OptionVariety | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM option_variety
            WHERE
                option = $1
                    AND
                variety = $2
                    AND
                product = $3
                    AND
                shop = $4
            `,
            [option, variety, product, shop],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    public async getVarietyOptionVarieties(
        variety: string,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<OptionVariety>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM option_variety
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

    public async deleteOptionVariety(
        option: string,
        variety: string,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM option_variety
            WHERE
                option = $1
                    AND
                variety = $2
                    AND
                product = $3
                    AND
                shop = $4
            `,
            [option, variety, product, shop],
        );
    }

    private bake(row: any): OptionVariety {
        return new OptionVariety(
            row.value,
            row.option,
            row.variety,
            row.product,
            row.shop,
        );
    }
}
