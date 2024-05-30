import { Injectable } from '@nestjs/common';
import { Shop } from '../models/shop';
import { PoolClient } from 'pg';

@Injectable()
export class ShopRepository {
    public async createShop(
        name: string,
        tid: string | null,
        botToken: string,
        onMaintenance: boolean,
        maintenanceVersion: number,
        mainDescription: string | null,
        mainFileTid: string | null,
        aboutDescription: string | null,
        aboutFileTid: string | null,
        faqDescription: string | null,
        faqFileTid: string | null,
        owner: number,
        poolClient: PoolClient,
    ): Promise<Shop> {
        const result = await poolClient.query(
            `
            INSERT INTO
            shop (
                name, 
                tid,
                bot_token, 
                on_maintenance, 
                maintenance_version, 
                main_description, 
                main_file_tid,
                about_description,
                about_file_tid,
                faq_description,
                faq_file_tid,
                owner
            )
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
            `,
            [
                name,
                tid,
                botToken,
                onMaintenance,
                maintenanceVersion,
                mainDescription,
                mainFileTid,
                aboutDescription,
                aboutFileTid,
                faqDescription,
                faqFileTid,
                owner,
            ],
        );

        return this.bake(result.rows[0]);
    }

    public async updateShop(shop: Shop, poolClient: PoolClient): Promise<void> {
        await poolClient.query(
            `
            UPDATE shop 
            SET
                tid = $2,
                bot_token = $3,
                on_maintenance = $4, 
                maintenance_version = $5, 
                main_description = $6, 
                main_file_tid = $7,
                about_description = $8,
                about_file_tid = $9,
                faq_description = $10,
                faq_file_tid = $11,
                owner = $12
            WHERE name = $1
            `,
            [
                shop.name,
                shop.tid,
                shop.botToken,
                shop.onMaintenance,
                shop.maintenanceVersion,
                shop.mainDescription,
                shop.mainFileTid,
                shop.aboutDescription,
                shop.aboutFileTid,
                shop.faqDescription,
                shop.faqFileTid,
                shop.owner,
            ],
        );
    }

    public async getShop(
        name: string,
        poolClient: PoolClient,
    ): Promise<Shop | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM shop
            WHERE name = $1
            `,
            [name],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    public async getShopForce(
        name: string,
        poolClient: PoolClient,
    ): Promise<Shop> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM shop
            WHERE name = $1
            `,
            [name],
        );

        if (result.rowCount === 0) {
            throw new Error('Database inconsistency detected.');
        }

        return this.bake(result.rows[0]);
    }

    public async getShopByTid(
        tid: string,
        poolClient: PoolClient,
    ): Promise<Shop | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM shop
            WHERE tid = $1
            `,
            [tid],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    public async getAllShops(poolClient: PoolClient): Promise<Array<Shop>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM shop
            `,
        );

        return result.rows.map((row) => this.bake(row));
    }

    public async deleteShop(
        name: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM shop
            WHERE name = $1
            `,
            [name],
        );
    }

    private bake(row: any): Shop {
        return new Shop(
            row.name,
            row.tid,
            row.bot_token,
            row.on_maintenance,
            row.maintenance_version,
            row.main_description,
            row.main_file_tid,
            row.about_description,
            row.about_file_tid,
            row.faq_description,
            row.faq_file_tid,
            row.owner,
        );
    }
}
