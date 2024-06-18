import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Payment } from '../models/payment';

@Injectable()
export class PaymentRepository {
    public async createPayment(
        uid: string,
        type: 'to-shop' | 'to-referral' | 'to-owner',
        method: 'manual',
        status: 'pending' | 'accepted' | 'rejected',
        sum: number,
        createdAt: Date,
        poolClient: PoolClient,
    ): Promise<Payment> {
        const result = await poolClient.query(
            `
            INSERT INTO
            payment (
                uid,
                type,
                method,
                status,
                sum,
                created_at
            )
            VALUES
                ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [uid, type, method, status, sum, createdAt],
        );

        return this.bake(result.rows[0]);
    }

    public async updatePayment(
        payment: Payment,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            UPDATE payment
            SET status = $2
            WHERE uid = $1
            `,
            [payment.uid, payment.status],
        );
    }

    public async getPayment(
        uid: string,
        poolClient: PoolClient,
    ): Promise<Payment | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM payment
            WHERE uid = $1
            `,
            [uid],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    private bake(row: any): Payment {
        return new Payment(
            row.uid,
            row.type,
            row.method,
            row.status,
            row.sum,
            row.created_at,
        );
    }
}
