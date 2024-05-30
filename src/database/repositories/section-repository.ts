import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Section } from '../models/section';
import { Tag } from '../models/tag';

@Injectable()
export class SectionRepository {
    public async createSection(
        name: string,
        fullName: string,
        description: string,
        fileTid: string | null,
        parent: string | null,
        rank: number,
        newLine: boolean,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Section> {
        const result = await poolClient.query(
            `
            INSERT INTO
            section (
                name, 
                full_name, 
                description, 
                file_tid, 
                parent, 
                rank, 
                new_line, 
                shop
            )
            VALUES
                ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            `,
            [name, fullName, description, fileTid, parent, rank, newLine, shop],
        );

        return this.bake(result.rows[0]);
    }

    public async updateSection(
        section: Section,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            UPDATE section
            SET
                full_name = $2, 
                description = $3, 
                file_tid = $4, 
                parent = $5, 
                rank = $6, 
                new_line = $7
            WHERE
                name = $1
                    AND
                shop = $8
            `,
            [
                section.name,
                section.fullName,
                section.description,
                section.fileTid,
                section.parent,
                section.rank,
                section.newLine,
                section.shop,
            ],
        );
    }

    public async getSection(
        name: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Section | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM section
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

    public async getChildSectionByFullName(
        parent: string,
        fullName: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Section | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM section
            WHERE
                parent = $1
                    AND
                full_name = $2
                    AND
                shop = $3
            `,
            [parent, fullName, shop],
        );

        if (result.rowCount === 0) {
            return null;
        }

        return this.bake(result.rows[0]);
    }

    public async getChildSections(
        name: string | null,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<Section>> {
        if (name === null) {
            const result = await poolClient.query(
                `
                SELECT *
                FROM section
                WHERE
                    parent IS NULL
                        AND
                    shop = $1
                ORDER BY
                    rank
                    ASC
                `,
                [shop],
            );

            return result.rows.map((row) => this.bake(row));
        } else {
            const result = await poolClient.query(
                `
                SELECT *
                FROM section
                WHERE
                    parent = $1
                        AND
                    shop = $2
                ORDER BY
                    rank
                    ASC
                `,
                [name, shop],
            );

            return result.rows.map((row) => this.bake(row));
        }
    }

    public async getAllSections(
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<Section>> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM section
            WHERE
                shop = $1
            `,
            [shop],
        );

        return result.rows.map((row) => this.bake(row));
    }

    public async deleteSection(
        name: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            DELETE
            FROM section
            WHERE
                name = $1
                    AND
                shop = $2
            `,
            [name, shop],
        );
    }

    public async getSectionTags(
        name: string,
        shop: string,
        poolClient: PoolClient,
    ): Promise<Array<Tag>> {
        const result = await poolClient.query(
            `
            SELECT 
                ts.tag AS name, ts.shop AS shop
            FROM 
                section s
                    LEFT JOIN 
                tag_section ts
                    ON
                    s.name = ts.section
                        AND
                    s.shop = ts.shop
            WHERE
                s.name = $1
                    AND
                s.shop = $2
            `,
            [name, shop],
        );

        return result.rows.map((row) => this.bakeTag(row));
    }

    private bake(row: any): Section {
        return new Section(
            row.name,
            row.full_name,
            row.description,
            row.file_tid,
            row.parent,
            row.rank,
            row.new_line,
            row.shop,
        );
    }

    private bakeTag(row: any): Tag {
        return new Tag(row.name, row.shop);
    }
}
