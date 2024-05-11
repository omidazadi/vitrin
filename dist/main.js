"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const core_1 = require("@nestjs/core");
const vitrin_module_1 = require("./bots/vitrin/vitrin-module");
const bot_runner_1 = require("./infrastructures/bot-runner");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(vitrin_module_1.VitrinModule);
    const botRunner = app.get(bot_runner_1.BotRunner);
    await botRunner.run();
}
bootstrap();
//# sourceMappingURL=main.js.map