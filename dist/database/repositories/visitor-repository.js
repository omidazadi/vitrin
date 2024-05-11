"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisitorRepository = void 0;
const common_1 = require("@nestjs/common");
const visitor_1 = require("../models/visitor");
let VisitorRepository = class VisitorRepository {
    async getVisitorByTidLocking(tid, poolClient) {
        const result = await poolClient.query(`
            SELECT *
            FROM visitor
            WHERE tid = $1
            FOR UPDATE
            `, [tid]);
        if (result.rowCount === 0) {
            return null;
        }
        return this.bake(result.rows[0]);
    }
    async createVisitor(tid, data, poolClient) {
        const result = await poolClient.query(`
            INSERT INTO
            visitor (tid, data)
            VALUES
                ($1, $2)
            RETURNING *
            `, [tid, data]);
        return this.bake(result.rows[0]);
    }
    async updateVisitor(visitor, poolClient) {
        await poolClient.query(`
            UPDATE visitor
            SET tid = $2, data = $3
            WHERE id = $1
            `, [visitor.id, visitor.tid, visitor.data]);
    }
    bake(row) {
        return new visitor_1.Visitor(row.id, row.tid, row.data);
    }
};
exports.VisitorRepository = VisitorRepository;
exports.VisitorRepository = VisitorRepository = __decorate([
    (0, common_1.Injectable)()
], VisitorRepository);
//# sourceMappingURL=visitor-repository.js.map