import { Injectable } from '@nestjs/common';
import { Shop } from '../models/shop';
import { PoolClient } from 'pg';

@Injectable()
export class ShopRepository {
    public async createShop(
        name: string,
        fullName: string,
        botUsername: string,
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
                full_name, 
                bot_username, 
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
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
            `,
            [
                name,
                fullName,
                botUsername,
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

    public async updateShow(shop: Shop, poolClient: PoolClient): Promise<void> {
        await poolClient.query(
            `
            UPDATE shop 
            SET
                full_name = $2, 
                bot_username = $3, 
                bot_token = $4,
                on_maintenance = $5, 
                maintenance_version = $6, 
                main_description = $7, 
                main_file_tid = $8,
                about_description = $9,
                about_file_tid = $10,
                faq_description = $11,
                faq_file_tid = $12,
                owner = $13
            )
            WHERE name = $1
            `,
            [
                shop.name,
                shop.fullName,
                shop.botUsername,
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

    private bake(row: any): Shop {
        return new Shop(
            row.name,
            row.full_name,
            row.bot_username,
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
