import fs from 'fs/promises';
import { Injectable } from '@nestjs/common';
import { Client, Pool, PoolClient } from 'pg';
import { PostgresConfig } from './configs/postgres-config';

@Injectable()
export class DatabaseManager {
    private pool: Pool;
    private postgresConfig: PostgresConfig;

    public constructor(postgresConfig: PostgresConfig) {
        this.postgresConfig = postgresConfig;
        this.pool = new Pool({
            host: this.postgresConfig.host,
            port: this.postgresConfig.port,
            user: this.postgresConfig.user,
            password: this.postgresConfig.password,
            database: this.postgresConfig.database,
            connectionTimeoutMillis: this.postgresConfig.connectionTimeout,
            max: this.postgresConfig.maxPoolCapacity,
        });
    }

    public async executeDDL(): Promise<void> {
        const client = new Client({
            host: this.postgresConfig.host,
            port: this.postgresConfig.port,
            user: this.postgresConfig.user,
            password: this.postgresConfig.password,
        });
        await client.connect();
        try {
            await client.query(
                `CREATE DATABASE ${this.postgresConfig.database}`,
            );
        } catch (e: unknown) {}
        await client.end();

        const poolClient = await this.createTransaction();
        await poolClient.query(
            await fs.readFile('src/database/ddl.sql', 'utf-8'),
        );
        await this.commitTransaction(poolClient);
    }

    public async createTransaction(): Promise<PoolClient> {
        const poolClient = await this.pool.connect();
        await poolClient.query('BEGIN');
        return poolClient;
    }

    public async commitTransaction(poolClient: PoolClient): Promise<void> {
        await poolClient.query('COMMIT');
        poolClient.release();
    }

    public async rollbackTransaction(poolClient: PoolClient): Promise<void> {
        await poolClient.query('ROLLBACK');
        poolClient.release();
    }
}
