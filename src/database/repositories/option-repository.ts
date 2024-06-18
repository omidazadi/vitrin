import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Option } from '../models/option';

@Injectable()
export class OptionRepository {
    public async createOption(
        name: string,
        fullName: string,
        fullButton: string,
        fileTid: string | null,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Option> {
        const result = await poolClient.query(
            `
            INSERT INTO
            option (
                name,
                full_name,
                full_button,
                file_tid,
                product,
                shop
            )
            VALUES
                ($1, $2, $3, $4, $5, $6)
            RETURNING *
            `,
            [name, fullName, fullButton, fileTid, product, shop],
        );

        return this.bake(result.rows[0]);
    }

    public async updateOption(
        option: Option,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            UPDATE option
            SET
                full_name = $2,
                full_button = $3,
                file_tid = $4
            WHERE
                name = $1
                    AND
                product = $5
                    AND
                shop = $6
            `,
            [
                option.name,
                option.fullName,
                option.fullButton,
                option.fileTid,
                option.product,
                option.shop,
            ],
        );
    }

    public async getOption(
        name: string,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Option | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM option
            WHERE
                name = $1
                    AND
                product = $2
                    AND
                shop = $3
            ORDER BY
                name
                ASC
            `,
            [name, product, shop],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    public async deleteOption(
        name: string,
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM option
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

    public async getProductOptions(
        product: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<Option>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM option
            WHERE
                product = $1
                    AND
                shop = $2
            ORDER BY
                full_name
                ASC
            `,
            [product, shop],
        );

        return result.rows.map((row) => this.bake(row));
    }

    private bake(row: any): Option {
        return new Option(
            row.name,
            row.full_name,
            row.full_button,
            row.file_tid,
            row.product,
            row.shop,
        );
    }
}
