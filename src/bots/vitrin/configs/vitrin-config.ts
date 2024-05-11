import { IsDefined, IsString } from 'class-validator';

export class VitrinConfig {
    @IsString()
    @IsDefined()
    public owner: string;

    @IsString()
    @IsDefined()
    public botUsername: string;

    @IsString()
    @IsDefined()
    public botToken: string;

    public constructor() {
        this.owner = process.env.VITRIN_OWNER!;
        this.botUsername = process.env.VITRIN_BOT_USERNAME!;
        this.botToken = process.env.VITRIN_BOT_TOKEN!;
    }
}
