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
        supportUsername: string | null,
        cardNumber: string | null,
        cardOwner: string | null,
        beforePurchaseMessage: string | null,
        afterPurchaseMessage: string | null,
        purchaseChannelTid: string | null,
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
                support_username,
                card_number,
                card_owner,
                before_purchase_message,
                after_purchase_message,
                purchase_channel_tid,
                owner
            )
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
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
                supportUsername,
                cardNumber,
                cardOwner,
                beforePurchaseMessage,
                afterPurchaseMessage,
                purchaseChannelTid,
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
                support_username = $12,
                card_number = $13,
                card_owner = $14,
                before_purchase_message = $15,
                after_purchase_message = $16,
                purchase_channel_tid = $17,
                owner = $18
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
                shop.supportUsername,
                shop.cardNumber,
                shop.cardOwner,
                shop.beforePurchaseMessage,
                shop.afterPurchaseMessage,
                shop.purchaseChannelTid,
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

    public async getShopByTidLocking(
        tid: string,
        poolClient: PoolClient,
    ): Promise<Shop | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM shop
            WHERE tid = $1
            FOR SHARE
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
            row.support_username,
            row.card_number,
            row.card_owner,
            row.before_purchase_message,
            row.after_purchase_message,
            row.purchase_channel_tid,
            row.owner,
        );
    }
}
