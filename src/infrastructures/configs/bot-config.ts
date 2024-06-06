import { Injectable } from '@nestjs/common';
import { IsDefined, IsIn } from 'class-validator';

@Injectable()
export class BotConfig {
    @IsIn(['development', 'production'])
    @IsDefined()
    public env: string;

    public constructor() {
        this.env = process.env.BOT_ENV!;
    }
}
