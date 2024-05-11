import { Injectable } from '@nestjs/common';
import { IsDefined, IsNumber, IsString, Max, Min } from 'class-validator';

@Injectable()
export class PostgresConfig {
    @IsString()
    @IsDefined()
    public host: string;

    @Min(0)
    @Max(65535)
    @IsNumber()
    @IsDefined()
    public port: number;

    @IsString()
    @IsDefined()
    public user: string;

    @IsString()
    @IsDefined()
    public password: string;

    @IsString()
    @IsDefined()
    public database: string;

    @Min(0)
    @Max(2000)
    @IsNumber()
    @IsDefined()
    public connectionTimeout: number;

    @Min(0)
    @Max(1000)
    @IsNumber()
    @IsDefined()
    public maxPoolCapacity: number;

    public constructor() {
        this.host = process.env.POSTGRES_HOST!;
        this.port = parseInt(process.env.POSTGRES_PORT!);
        this.user = process.env.POSTGRES_USER!;
        this.password = process.env.POSTGRES_PASSWORD!;
        this.database = process.env.POSTGRES_DATABASE!;
        this.connectionTimeout = parseInt(
            process.env.POSTGRES_CONNECTION_TIMEOUT!,
        );
        this.maxPoolCapacity = parseInt(
            process.env.POSTGRES_MAX_POOL_CAPACITY!,
        );
    }
}
