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
exports.PostgresConfig = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
let PostgresConfig = class PostgresConfig {
    constructor() {
        this.host = process.env.POSTGRES_HOST;
        this.port = parseInt(process.env.POSTGRES_PORT);
        this.user = process.env.POSTGRES_USER;
        this.password = process.env.POSTGRES_PASSWORD;
        this.database = process.env.POSTGRES_DATABASE;
        this.connectionTimeout = parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT);
        this.maxPoolCapacity = parseInt(process.env.POSTGRES_MAX_POOL_CAPACITY);
    }
};
exports.PostgresConfig = PostgresConfig;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PostgresConfig.prototype, "host", void 0);
__decorate([
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(65535),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], PostgresConfig.prototype, "port", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PostgresConfig.prototype, "user", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PostgresConfig.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], PostgresConfig.prototype, "database", void 0);
__decorate([
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(2000),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], PostgresConfig.prototype, "connectionTimeout", void 0);
__decorate([
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1000),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Number)
], PostgresConfig.prototype, "maxPoolCapacity", void 0);
exports.PostgresConfig = PostgresConfig = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PostgresConfig);
//# sourceMappingURL=postgres-config.js.map