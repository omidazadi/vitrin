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
exports.VitrinUserBuilder = void 0;
const common_1 = require("@nestjs/common");
const visitor_repository_1 = require("../../database/repositories/visitor-repository");
let VitrinUserBuilder = class VitrinUserBuilder {
    constructor(visitorRepository) {
        this.visitorRepository = visitorRepository;
    }
    async buildUser(telegramContext, poolClient) {
        let visitor = await this.visitorRepository.getVisitorByTidLocking(telegramContext.tid, poolClient);
        if (visitor !== null) {
            return visitor;
        }
        else {
            return await this.visitorRepository.createVisitor(telegramContext.tid, { state: 'home' }, poolClient);
        }
    }
};
exports.VitrinUserBuilder = VitrinUserBuilder;
exports.VitrinUserBuilder = VitrinUserBuilder = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [visitor_repository_1.VisitorRepository])
], VitrinUserBuilder);
//# sourceMappingURL=user-builder.js.map