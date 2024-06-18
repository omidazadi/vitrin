import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Purchase } from '../models/purchase';

@Injectable()
export class PurchaseRepository {
    public async createPurchase(
        uid: string,
        paymentUid: string,
        customerReceiptTid: string | null,
        shopReceiptTid: string | null,
        customer: number | null,
        recipientFirstName: string,
        recipientLastName: string,
        recipientAddress: string,
        recipientZipCode: string,
        status: 'pending' | 'canceled' | 'paid' | 'delivered',
        trackingNumbers: Array<string> | null,
        referral: string | null,
        referralFee: number,
        referralDepositStatementUid: string | null,
        shippingFee: number,
        sum: number,
        createdAt: Date,
        shop: string | null,
        poolClient: PoolClient,
    ): Promise<Purchase> {
        const result = await poolClient.query(
            `
            INSERT INTO
            purchase (
                uid,
                payment_uid,
                customer_receipt_tid,
                shop_receipt_tid,
                customer,
                recipient_first_name,
                recipient_last_name,
                recipient_address,
                recipient_zip_code,
                status,
                tracking_numbers,
                referral,
                referral_fee,
                referral_deposit_statement_uid,
                shipping_fee,
                sum,
                created_at,
                shop
            )
            VALUES
                (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5,
                    $6,
                    $7,
                    $8,
                    $9,
                    $10,
                    $11,
                    $12,
                    $13,
                    $14,
                    $15,
                    $16,
                    $17,
                    $18
                )
            RETURNING *
            `,
            [
                uid,
                paymentUid,
                customerReceiptTid,
                shopReceiptTid,
                customer,
                recipientFirstName,
                recipientLastName,
                recipientAddress,
                recipientZipCode,
                status,
                trackingNumbers,
                referral,
                referralFee,
                referralDepositStatementUid,
                shippingFee,
                sum,
                createdAt,
                shop,
            ],
        );

        return this.bake(result.rows[0]);
    }

    public async updatePurchase(
        purchase: Purchase,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            UPDATE purchase
            SET
                customer_receipt_tid = $2,
                shop_receipt_tid = $3,
                status = $4,
                tracking_numbers = $5,
                referral_deposit_statement_uid = $6
            WHERE uid = $1
            `,
            [
                purchase.uid,
                purchase.customerReceiptTid,
                purchase.shopReceiptTid,
                purchase.status,
                purchase.trackingNumbers,
                purchase.referralDepositStatementUid,
            ],
        );
    }

    public async getPurchase(
        uid: string,
        poolClient: PoolClient,
    ): Promise<Purchase | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM purchase
            WHERE uid = $1
            `,
            [uid],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    public async getPurchasesBeforeDate(
        date: Date,
        poolClient: PoolClient,
    ): Promise<Array<Purchase>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM purchase
            WHERE 
                status = 'pending'
                    AND
                created_at < $1
            `,
            [date],
        );

        return result.rows.map((row) => this.bake(row));
    }

    public async getCurrentDeliveredReferralPurchases(
        referral: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<Purchase>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM purchase
            WHERE 
                status = 'delivered'
                    AND
                referral_deposit_statement_uid IS NULL
                    AND
                referral = $1
                    AND
                shop = $2
            `,
            [referral, shop],
        );

        return result.rows.map((row) => this.bake(row));
    }

    public async getTotalReferralPurchaseCount(
        referral: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<number> {
        const result = await poolClient.query(
            `
            SELECT COUNT(*) AS cnt
            FROM purchase
            WHERE 
                (status = 'paid' OR status = 'delivered')
                    AND
                referral = $1
                    AND
                shop = $2
            GROUP BY
                referral,
                shop
            `,
            [referral, shop],
        );

        return result.rows[0].cnt;
    }

    public async getTotalReferralPurchaseSum(
        referral: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<number> {
        const result = await poolClient.query(
            `
            SELECT SUM(referral_fee) AS sum
            FROM purchase
            WHERE 
                (status = 'paid' OR status = 'delivered')
                    AND
                referral = $1
                    AND
                shop = $2
            GROUP BY
                referral,
                shop
            `,
            [referral, shop],
        );

        return result.rows[0].sum;
    }

    public async getCurrentReferralPurchaseCount(
        referral: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<number> {
        const result = await poolClient.query(
            `
            SELECT COUNT(*) AS cnt
            FROM purchase
            WHERE 
                (status = 'paid' OR status = 'delivered')
                    AND
                referral_deposit_statement_uid IS NULL
                    AND
                referral = $1
                    AND
                shop = $2
            GROUP BY
                referral,
                shop
            `,
            [referral, shop],
        );

        return result.rows[0].cnt;
    }

    public async getCurrentReferralPurchaseSum(
        referral: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<number> {
        const result = await poolClient.query(
            `
            SELECT SUM(referral_fee) AS sum
            FROM purchase
            WHERE 
                (status = 'paid' OR status = 'delivered')
                    AND
                referral_deposit_statement_uid IS NULL
                    AND
                referral = $1
                    AND
                shop = $2
            GROUP BY
                referral,
                shop
            `,
            [referral, shop],
        );

        return result.rows[0].sum;
    }

    private bake(row: any): Purchase {
        return new Purchase(
            row.uid,
            row.payment_uid,
            row.customer_receipt_tid,
            row.shop_receipt_tid,
            row.customer,
            row.recipient_first_name,
            row.recipient_last_name,
            row.recipient_address,
            row.recipient_zip_code,
            row.status,
            row.tracking_numbers,
            row.referral,
            row.referral_fee,
            row.referral_deposit_statement_uid,
            row.shipping_fee,
            row.sum,
            row.created_at,
            row.shop,
        );
    }
}
