import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { CartItem } from '../models/cart-item';

@Injectable()
export class CartItemRepository {
    public async createCartItem(
        customer: number,
        product: string,
        variety: string,
        createdAt: Date,
        shop: string,
        poolClient: PoolClient,
    ): Promise<CartItem> {
        const result = await poolClient.query(
            `
            INSERT INTO
            cart_item (
                customer,
                product,
                variety,
                created_at,
                shop
            )
            VALUES
                ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [customer, product, variety, createdAt, shop],
        );

        return this.bake(result.rows[0]);
    }

    public async getCartItem(
        customer: number,
        product: string,
        variety: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<CartItem | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM cart_item
            WHERE
                customer = $1
                    AND
                product = $2
                    AND
                variety = $3
                    AND
                shop = $4
            `,
            [customer, product, variety, shop],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    public async getProductCart(
        customer: number,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<CartItem>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM cart_item
            WHERE
                customer = $1
                    AND
                product = $2
                    AND
                shop = $3
            `,
            [customer, product, shop],
        );

        return result.rows.map((row) => this.bake(row));
    }

    public async getCustomerCart(
        customer: number,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<CartItem>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM cart_item
            WHERE
                customer = $1
                    AND
                shop = $2
            ORDER BY
                created_at
            `,
            [customer, shop],
        );

        return result.rows.map((row) => this.bake(row));
    }

    public async doesHaveInCart(
        customer: number,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<boolean> {
        const result = await poolClient.query(
            `
            SELECT 1
            FROM cart_item
            WHERE
                customer = $1
                    AND
                product = $2
                    AND
                shop = $3
            `,
            [customer, product, shop],
        );

        return result.rowCount !== null && result.rowCount > 0;
    }

    public async deleteCartItem(
        customer: number,
        product: string,
        variety: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM cart_item
            WHERE
                customer = $1
                    AND
                product = $2
                    AND
                variety = $3
                    AND
                shop = $4
            `,
            [customer, product, variety, shop],
        );
    }

    public async deleteProductCart(
        customer: number,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM cart_item
            WHERE
                customer = $1
                    AND
                product = $2
                    AND
                shop = $3
            `,
            [customer, product, shop],
        );
    }

    private bake(row: any): CartItem {
        return new CartItem(
            row.customer,
            row.product,
            row.variety,
            row.created_at,
            row.shop,
        );
    }
}
