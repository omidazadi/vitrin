"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
const promises_1 = __importDefault(require("fs/promises"));
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const postgres_config_1 = require("./configs/postgres-config");
let DatabaseManager = class DatabaseManager {
    constructor(postgresConfig) {
        this.postgresConfig = postgresConfig;
        this.pool = new pg_1.Pool({
            host: this.postgresConfig.host,
            port: this.postgresConfig.port,
            user: this.postgresConfig.user,
            password: this.postgresConfig.password,
            database: this.postgresConfig.database,
            connectionTimeoutMillis: this.postgresConfig.connectionTimeout,
            max: this.postgresConfig.maxPoolCapacity,
        });
    }
    async executeDDL() {
        const client = new pg_1.Client({
            host: this.postgresConfig.host,
            port: this.postgresConfig.port,
            user: this.postgresConfig.user,
            password: this.postgresConfig.password,
        });
        await client.connect();
        try {
            await client.query(`CREATE DATABASE ${this.postgresConfig.database}`);
        }
        catch (e) { }
        await client.end();
        const poolClient = await this.createTransaction();
        await poolClient.query(await promises_1.default.readFile('src/database/ddl.sql', 'utf-8'));
        await this.commitTransaction(poolClient);
    }
    async createTransaction() {
        const poolClient = await this.pool.connect();
        await poolClient.query('BEGIN');
        return poolClient;
    }
    async commitTransaction(poolClient) {
        await poolClient.query('COMMIT');
        poolClient.release();
    }
    async rollbackTransaction(poolClient) {
        await poolClient.query('ROLLBACK');
        poolClient.release();
    }
};
exports.DatabaseManager = DatabaseManager;
exports.DatabaseManager = DatabaseManager = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [postgres_config_1.PostgresConfig])
], DatabaseManager);
//# sourceMappingURL=database-manager.js.map