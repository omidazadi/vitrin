import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Customer } from '../models/customer';

@Injectable()
export class CustomerRepository {
    public async getCustomerByTidAndShopLocking(
        tid: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Customer | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM customer
            WHERE 
                tid = $1
                    AND
                shop = $2
            FOR UPDATE
            `,
            [tid, shop],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    public async getCustomer(
        id: number,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Customer | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM customer
            WHERE 
                id = $1
                    AND
                shop = $2
            `,
            [id, shop],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    public async getNumberOfReferralCustomers(
        referral: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<number> {
        const result = await poolClient.query(
            `
            SELECT COUNT(*) as cnt
            FROM customer
            WHERE 
                referral = $1
                    AND
                shop = $2
            GROUP BY
                referral,
                shop
            `,
            [referral, shop],
        );

        return result.rows.length === 0 ? 0 : result.rows[0].cnt;
    }

    public async createCustomer(
        tid: string,
        data: Customer.Data,
        firstName: string | null,
        lastName: string | null,
        phoneNumber: string | null,
        address: string | null,
        zipCode: string | null,
        referral: string | null,
        maintenanceVersion: number,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Customer> {
        const result = await poolClient.query(
            `
            INSERT INTO
            customer (
                tid, 
                data, 
                first_name, 
                last_name, 
                phone_number,
                address, 
                zip_code, 
                referral, 
                maintenance_version, 
                shop
            )
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
            `,
            [
                tid,
                data,
                firstName,
                lastName,
                phoneNumber,
                address,
                zipCode,
                referral,
                maintenanceVersion,
                shop,
            ],
        );

        return this.bake(result.rows[0]);
    }

    public async updateCustomer(
        customer: Customer,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            UPDATE customer
            SET
                tid = $2, 
                data = $3, 
                first_name = $4, 
                last_name = $5, 
                phone_number = $6,
                address = $7,
                zip_code = $8, 
                referral = $9, 
                maintenance_version = $10, 
                shop = $11
            WHERE id = $1
            `,
            [
                customer.id,
                customer.tid,
                customer.data,
                customer.firstName,
                customer.lastName,
                customer.phoneNumber,
                customer.address,
                customer.zipCode,
                customer.referral,
                customer.maintenanceVersion,
                customer.shop,
            ],
        );
    }

    private bake(row: any): Customer {
        return new Customer(
            row.id,
            row.tid,
            row.data,
            row.first_name,
            row.last_name,
            row.phone_number,
            row.address,
            row.zip_code,
            row.referral,
            row.maintenance_version,
            row.shop,
        );
    }
}
