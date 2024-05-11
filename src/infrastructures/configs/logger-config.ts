import { Injectable } from '@nestjs/common';
import { IsDefined, IsString } from 'class-validator';

@Injectable()
export class LoggerConfig {
    @IsString()
    @IsDefined()
    public channelUsername: string;

    public constructor() {
        this.channelUsername = process.env.LOGGER_CHANNEL_USERNAME!;
    }
}
