import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Customer } from '../models/customer';

@Injectable()
export class CustomerRepository {
    public async getCustomerByTidLocking(
        tid: string,
        poolClient: PoolClient,
    ): Promise<Customer | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM customer
            WHERE tid = $1
            FOR UPDATE
            `,
            [tid],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    public async createCustomer(
        tid: string,
        data: Customer.Data,
        firstName: string | null,
        lastName: string | null,
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
                address, 
                zip_code, 
                referral, 
                maintenance_version, 
                shop
            )
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            `,
            [
                tid,
                data,
                firstName,
                lastName,
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
                address = $6,  
                zip_code = $7, 
                referral = $8, 
                maintenance_version = $9, 
                shop = $10
            WHERE id = $1
            `,
            [
                customer.id,
                customer.tid,
                customer.data,
                customer.firstName,
                customer.lastName,
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
            row.address,
            row.zip_code,
            row.referral,
            row.maintenance_version,
            row.shop,
        );
    }
}
