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
exports.HydratedFrontend = void 0;
const common_1 = require("@nestjs/common");
const grammy_1 = require("grammy");
const logger_1 = require("../logger");
const dry_frontend_1 = require("./dry-frontend");
let HydratedFrontend = class HydratedFrontend {
    constructor(dryFrontend, logger) {
        this.dryFrontend = dryFrontend;
        this.logger = logger;
    }
    async sendActionMessage(tid, action, options) {
        try {
            await this.dryFrontend.sendActionMessage(tid, action, options);
            return true;
        }
        catch (e) {
            if (e instanceof grammy_1.GrammyError) {
                await this.logger.warn(e.toString());
                return false;
            }
            else {
                throw e;
            }
        }
    }
    async sendSystemMessage(tid, messageType, options) {
        try {
            await this.dryFrontend.sendSystemMessage(tid, messageType, options);
            return true;
        }
        catch (e) {
            if (e instanceof grammy_1.GrammyError) {
                await this.logger.warn(e.toString());
                return false;
            }
            else {
                throw e;
            }
        }
    }
};
exports.HydratedFrontend = HydratedFrontend;
exports.HydratedFrontend = HydratedFrontend = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dry_frontend_1.DryFrontend, logger_1.Logger])
], HydratedFrontend);
//# sourceMappingURL=hydrated-frontend.js.map