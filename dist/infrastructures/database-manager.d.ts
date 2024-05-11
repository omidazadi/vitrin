import { PoolClient } from 'pg';
import { PostgresConfig } from './configs/postgres-config';
export declare class DatabaseManager {
    private pool;
    private postgresConfig;
    constructor(postgresConfig: PostgresConfig);
    executeDDL(): Promise<void>;
    createTransaction(): Promise<PoolClient>;
    commitTransaction(poolClient: PoolClient): Promise<void>;
    rollbackTransaction(poolClient: PoolClient): Promise<void>;
}
