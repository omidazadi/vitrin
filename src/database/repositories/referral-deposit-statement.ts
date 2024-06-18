import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { ReferralDepositStatement } from '../models/referral_deposit_statement';

@Injectable()
export class ReferralDepositStatementRepository {
    public async createReferralDepositStatement(
        uid: string,
        paymentUid: string,
        referral: string | null,
        sum: number,
        createdAt: Date,
        shop: string | null,
        poolClient: PoolClient,
    ): Promise<ReferralDepositStatement> {
        const result = await poolClient.query(
            `
            INSERT INTO
            referral_deposit_statement (
                uid,
                payment_uid,
                referral,
                sum,
                created_at,
                shop
            )
            VALUES
                ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [uid, paymentUid, referral, sum, createdAt, shop],
        );

        return this.bake(result.rows[0]);
    }

    private bake(row: any): ReferralDepositStatement {
        return new ReferralDepositStatement(
            row.uid,
            row.payment_uid,
            row.referral,
            row.sum,
            row.created_at,
            row.shop,
        );
    }
}
