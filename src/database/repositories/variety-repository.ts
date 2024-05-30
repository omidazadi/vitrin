import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Variety } from '../models/variety';

@Injectable()
export class VarietyRepository {
    public async createVariety(
        name: string,
        product: string,
        price: number,
        stock: number,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Variety> {
        const result = await poolClient.query(
            `
            INSERT INTO
            variety (
                name,
                product,
                price,
                stock,
                shop
            )
            VALUES
                ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [name, product, price, stock, shop],
        );

        return this.bake(result.rows[0]);
    }

    public async updateVariety(
        variety: Variety,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            UPDATE variety
            SET
                price = $3,
                stock = $4
            WHERE
                name = $1
                    AND
                product = $2
                    AND
                shop = $5
            `,
            [
                variety.name,
                variety.product,
                variety.price,
                variety.stock,
                variety.shop,
            ],
        );
    }

    public async getVariety(
        name: string,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Variety | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM variety
            WHERE
                name = $1
                    AND
                product = $2
                    AND
                shop = $3
            `,
            [name, product, shop],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    public async getAllVarieties(
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<Variety>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM variety
            WHERE
                product = $1
                    AND
                shop = $2
            `,
            [product, shop],
        );

        return result.rows.map((row) => this.bake(row));
    }

    public async deleteVariety(
        name: string,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM variety
            WHERE
                name = $1
                    AND
                product = $2
                    AND
                shop = $3
            `,
            [name, product, shop],
        );
    }

    public async getProductVarieties(
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<Variety>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM variety
            WHERE
                product = $1
                    AND
                shop = $2
            `,
            [product, shop],
        );

        return result.rows.map((row) => this.bake(row));
    }

    private bake(row: any): Variety {
        return new Variety(
            row.name,
            row.product,
            row.price,
            row.stock,
            row.shop,
        );
    }
}
