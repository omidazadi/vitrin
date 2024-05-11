import { PoolClient } from 'pg';
import { Visitor } from '../models/visitor';
export declare class VisitorRepository {
    getVisitorByTidLocking(tid: string, poolClient: PoolClient): Promise<Visitor | null>;
    createVisitor(tid: string, data: Visitor.Data, poolClient: PoolClient): Promise<Visitor>;
    updateVisitor(visitor: Visitor, poolClient: PoolClient): Promise<void>;
    private bake;
}
