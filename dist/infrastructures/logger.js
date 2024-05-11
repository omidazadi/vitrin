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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const common_1 = require("@nestjs/common");
const grammy_1 = require("grammy");
const logger_config_1 = require("./configs/logger-config");
const dry_frontend_1 = require("./frontend/dry-frontend");
let Logger = class Logger {
    constructor(frontend, grammyBot, loggerConfig) {
        this.frontend = frontend;
        this.grammyBot = grammyBot;
        this.loggerConfig = loggerConfig;
        this.logChannelTid = '';
    }
    async configure() {
        this.logChannelTid = (await this.grammyBot.api.getChat('@' + this.loggerConfig.channelUsername)).id.toString();
    }
    async log(message) {
        await this.frontend.sendSystemMessage(this.logChannelTid, 'log', {
            context: {
                message: message,
                severity: 'log',
                date: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Tehran',
                }),
            },
        });
    }
    async warn(message) {
        if (typeof this.frontend === 'undefined') {
            return;
        }
        await this.frontend.sendSystemMessage(this.logChannelTid, 'warn', {
            context: {
                message: message,
                severity: 'warn',
                date: new Date().toLocaleString('en-US', {
                    timeZone: 'Asia/Tehran',
                }),
            },
        });
    }
};
exports.Logger = Logger;
exports.Logger = Logger = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dry_frontend_1.DryFrontend,
        grammy_1.Bot,
        logger_config_1.LoggerConfig])
], Logger);
//# sourceMappingURL=logger.js.map