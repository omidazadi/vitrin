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
exports.ContextManager = void 0;
const common_1 = require("@nestjs/common");
const request_context_1 = require("./request-context");
const database_manager_1 = require("../database-manager");
const telegram_context_1 = require("./telegram-context");
let ContextManager = class ContextManager {
    constructor(databaseManager, userBuilder) {
        this.databaseManager = databaseManager;
        this.userBuilder = userBuilder;
    }
    async buildRequestContext(grammyContext) {
        const poolClient = await this.databaseManager.createTransaction();
        const telegramContext = this.buildTelegramContext(grammyContext);
        let user = await this.userBuilder.buildUser(telegramContext, poolClient);
        return new request_context_1.RequestContext(telegramContext, user, poolClient);
    }
    buildTelegramContext(grammyContext) {
        let [tid, text, photo, video] = [null, null, null, null];
        if (typeof grammyContext.from !== 'undefined') {
            tid = grammyContext.from.id.toString();
        }
        else {
            throw new Error('Could not identify the source of telegram request.');
        }
        if (typeof grammyContext.message !== 'undefined') {
            if (typeof grammyContext.message.photo !== 'undefined') {
                photo = grammyContext.message.photo[0].file_id;
                if (typeof grammyContext.message.caption !== 'undefined') {
                    text = grammyContext.message.caption;
                }
            }
            else if (typeof grammyContext.message.video !== 'undefined') {
                video = grammyContext.message.video.file_id;
                if (typeof grammyContext.message.caption !== 'undefined') {
                    text = grammyContext.message.caption;
                }
            }
            else if (typeof grammyContext.message.text !== 'undefined') {
                text = grammyContext.message.text;
            }
        }
        return new telegram_context_1.TelegramContext(tid, text, photo, video);
    }
};
exports.ContextManager = ContextManager;
exports.ContextManager = ContextManager = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('USER_BUILDER')),
    __metadata("design:paramtypes", [database_manager_1.DatabaseManager, Object])
], ContextManager);
//# sourceMappingURL=context-manager.js.map