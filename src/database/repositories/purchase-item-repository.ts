import { Injectable } from '@nestjs/common';
import { PurchaseItem } from '../models/purchase-item';
import { PoolClient } from 'pg';

@Injectable()
export class PurchaseItemRepository {
    public async createPurchaseItem(
        purchaseUid: string,
        product: string | null,
        variety: string | null,
        itemFullName: string,
        price: number,
        createdAt: Date,
        shop: string | null,
        poolClient: PoolClient,
    ): Promise<PurchaseItem> {
        const result = await poolClient.query(
            `
            INSERT INTO
            purchase_item (
                purchase_uid,
                product,
                variety,
                item_full_name,
                price,
                created_at,
                shop
            )
            VALUES
                ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
            `,
            [
                purchaseUid,
                product,
                variety,
                itemFullName,
                price,
                createdAt,
                shop,
            ],
        );

        return this.bake(result.rows[0]);
    }

    public async getPurchaseItems(
        purchaseUid: string,
        poolClient: PoolClient,
    ): Promise<Array<PurchaseItem>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM purchase_item
            WHERE purchase_uid = $1
            `,
            [purchaseUid],
        );

        return result.rows.map((row) => this.bake(row));
    }

    private bake(row: any): PurchaseItem {
        return new PurchaseItem(
            row.purchase_uid,
            row.product,
            row.variety,
            row.item_full_name,
            row.price,
            row.created_at,
            row.shop,
        );
    }
}
