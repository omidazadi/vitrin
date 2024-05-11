import { Injectable } from '@nestjs/common';
import { PoolClient } from 'pg';
import { Visitor } from '../models/visitor';

@Injectable()
export class VisitorRepository {
    public async getVisitorByTidLocking(
        tid: string,
        poolClient: PoolClient,
    ): Promise<Visitor | null> {
        const result = await poolClient.query(
            `
            SELECT *
            FROM visitor
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

    public async createVisitor(
        tid: string,
        data: Visitor.Data,
        poolClient: PoolClient,
    ): Promise<Visitor> {
        const result = await poolClient.query(
            `
            INSERT INTO
            visitor (tid, data)
            VALUES
                ($1, $2)
            RETURNING *
            `,
            [tid, data],
        );

        return this.bake(result.rows[0]);
    }

    public async updateVisitor(
        visitor: Visitor,
        poolClient: PoolClient,
    ): Promise<void> {
        await poolClient.query(
            `
            UPDATE visitor
            SET tid = $2, data = $3
            WHERE id = $1
            `,
            [visitor.id, visitor.tid, visitor.data],
        );
    }

    private bake(row: any): Visitor {
        return new Visitor(row.id, row.tid, row.data);
    }
}
