import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { ReferralPartner } from '../models/referral-partner';

@Injectable()
export class ReferralPartnerRepository {
    public async createReferralPartner(
        name: string,
        visitor: number,
        fee: number,
        paymentData: string | null,
        shop: string,
        poolClient: PoolClient,
    ): Promise<ReferralPartner> {
        const result = await poolClient.query(
            `
            INSERT INTO
            referral_partner (name, visitor, fee, payment_data, shop)
            VALUES
                ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [name, visitor, fee, paymentData, shop],
        );

        return this.bake(result.rows[0]);
    }

    public async updateReferralPartner(
        referralPartner: ReferralPartner,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            UPDATE referral_partner
            SET fee = $2, payment_data = $3
            WHERE
                name = $1
                    AND
                shop = $4
            `,
            [
                referralPartner.name,
                referralPartner.fee,
                referralPartner.paymentData,
                referralPartner.shop,
            ],
        );
    }

    public async getReferralPartner(
        name: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<ReferralPartner | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM referral_partner
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

    public async getReferralPartnersByVisitor(
        visitor: number,
        poolClient: PoolClient,
    ): Promise<Array<ReferralPartner>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM referral_partner
            WHERE 
                visitor = $1
            `,
            [visitor],
        );

        return result.rows.map((row) => this.bake(row));
    }

    public async getAllReferralPartners(
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<ReferralPartner>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM referral_partner
            WHERE 
                shop = $1
            `,
            [shop],
        );

        return result.rows.map((row) => this.bake(row));
    }

    public async deleteReferralPartner(
        name: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM referral_partner
            WHERE
                name = $1
                    AND
                shop = $2
            `,
            [name, shop],
        );
    }

    private bake(row: any): ReferralPartner {
        return new ReferralPartner(
            row.name,
            row.visitor,
            row.fee,
            row.payment_data,
            row.shop,
        );
    }
}
