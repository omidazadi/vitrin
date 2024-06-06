import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Product } from '../models/product';
import { Tag } from '../models/tag';
import { Section } from '../models/section';
import { Variety } from '../models/variety';

@Injectable()
export class ProductRepository {
    public async createProduct(
        name: string,
        fullName: string,
        description: string,
        createdAt: Date,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Product> {
        const result = await poolClient.query(
            `
            INSERT INTO
            product (
                name,
                full_name,
                description,
                created_at,
                shop
            )
            VALUES
                ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [name, fullName, description, createdAt, shop],
        );

        return this.bake(result.rows[0]);
    }

    public async updateProduct(
        product: Product,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            UPDATE product
            SET
                full_name = $2,
                description = $3
            WHERE
                name = $1
                    AND
                shop = $4
            `,
            [product.name, product.fullName, product.description, product.shop],
        );
    }

    public async getAllProducts(
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<Product>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM product
            WHERE
                shop = $1
            `,
            [shop],
        );

        return result.rows.map((row) => this.bake(row));
    }

    public async getProduct(
        name: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Product | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM product
            WHERE
                name = $1
                    AND
                shop = $2
            `,
            [name, shop],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    public async deleteProduct(
        name: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM product
            WHERE
                name = $1
                    AND
                shop = $2
            `,
            [name, shop],
        );
    }

    public async getProductTags(
        name: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<Tag>> {
        const result = await poolClient.query(
            `
            SELECT 
                tp.tag AS name, tp.shop AS shop
            FROM 
                product p
                    JOIN tag_product tp
                    ON
                        p.name = tp.product
                            AND
                        p.shop = tp.shop
            WHERE
                p.name = $1
                    AND
                p.shop = $2
            `,
            [name, shop],
        );

        return result.rows.map((row) => this.bakeTag(row));
    }

    public async getProductsBySections(
        sections: Array<Section>,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<Product>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM product p
            WHERE
                p.shop = $2
                    AND
                NOT EXISTS (
                    SELECT 1
                    FROM tag_section ts
                        WHERE
                            ts.section = ANY($1)
                                AND
                            ts.shop = $2
                                AND
                            ts.tag <> ALL(
                                SELECT tp.tag
                                FROM tag_product tp
                                WHERE
                                    tp.product = p.name
                                        AND
                                    tp.shop = p.shop
                            )
                )
                    AND
                EXISTS (
                    SELECT 1
                    FROM variety v
                    WHERE
                        v.product = p.name
                            AND
                        v.stock > 0
                )
            ORDER BY
                created_at
                DESC
            `,
            [sections.map((section) => section.name), shop],
        );

        return result.rows.map((row) => this.bake(row));
    }

    public async getAvailableProductVarietyMedia(
        name: string,
        options: Array<{ option: string; value: string }>,
        isMain: boolean,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<string>> {
        const result = await poolClient.query(
            `
            SELECT DISTINCT
                vm.file_tid AS file_tid
            FROM 
                product p
                    JOIN variety v
                        ON
                            p.name = v.product
                                AND
                            p.shop = v.shop
                    JOIN variety_media vm
                        ON 
                            v.name = vm.variety
                                AND
                            v.product = vm.product
                                AND
                            v.shop = vm.shop
            WHERE
                p.name = $1
                    AND
                p.shop = $4
                    AND
                v.stock > 0
                    AND
                vm.is_main = $3
                    AND
                NOT EXISTS (
                    SELECT 1
                    FROM option_variety ov
                        WHERE
                            ov.variety = v.name
                                AND
                            ov.product = v.product
                                AND
                            ov.shop = v.shop
                                AND
                            EXISTS (
                                SELECT 1
                                FROM UNNEST($2::VARCHAR[]) qo
                                WHERE
                                    (qo::JSONB) ->> 'option' = ov.option
                                        AND
                                    (qo::JSONB) ->> 'value' != ov.value
                            )
                )
            `,
            [name, options, isMain, shop],
        );

        return result.rows.map((row) => row.file_tid);
    }

    public async getAvailableProductPrice(
        name: string,
        options: Array<{ option: string; value: string }>,
        shop: string,
        poolClient: PoolClient,
    ): Promise<number> {
        const result = await poolClient.query(
            `
            SELECT
                MIN(v.price) as price
            FROM 
                product p
                    JOIN variety v
                        ON
                            p.name = v.product
                                AND
                            p.shop = v.shop
            WHERE
                p.name = $1
                    AND
                p.shop = $3
                    AND
                v.stock > 0
                    AND
                NOT EXISTS (
                    SELECT 1
                    FROM option_variety ov
                        WHERE
                            ov.variety = v.name
                                AND
                            ov.product = v.product
                                AND
                            ov.shop = v.shop
                                AND
                            EXISTS (
                                SELECT 1
                                FROM UNNEST($2::VARCHAR[]) qo
                                WHERE
                                    (qo::JSONB) ->> 'option' = ov.option
                                        AND
                                    (qo::JSONB) ->> 'value' != ov.value
                            )
                )
            GROUP BY
                p.name,
                p.shop
            `,
            [name, options, shop],
        );

        return result.rows[0].price;
    }

    private bake(row: any): Product {
        return new Product(
            row.name,
            row.full_name,
            row.description,
            row.created_at,
            row.shop,
        );
    }

    private bakeTag(row: any): Tag {
        return new Tag(row.name, row.shop);
    }
}
