import dotenv from 'dotenv';
dotenv.config();
import { NestFactory } from '@nestjs/core';
import { VitrinModule } from './bots/vitrin/module';
import { BotRunner } from './infrastructures/bot-runner';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(VitrinModule);
    const botRunner = app.get(BotRunner);
    await botRunner.run();
}
bootstrap();
