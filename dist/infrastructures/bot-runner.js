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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotRunner = void 0;
const common_1 = require("@nestjs/common");
const grammy_1 = require("grammy");
const logger_1 = require("./logger");
let BotRunner = class BotRunner {
    constructor(grammyBot, gateway, logger) {
        this.grammyBot = grammyBot;
        this.gateway = gateway;
        this.logger = logger;
    }
    async run() {
        await this.gateway.initialize();
        this.grammyBot.on('message', this.gateway.recieve.bind(this.gateway));
        this.grammyBot.start();
        await this.logger.log('Bot is live.');
    }
};
exports.BotRunner = BotRunner;
exports.BotRunner = BotRunner = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('GATEWAY')),
    __metadata("design:paramtypes", [grammy_1.Bot, Object, logger_1.Logger])
], BotRunner);
//# sourceMappingURL=bot-runner.js.map