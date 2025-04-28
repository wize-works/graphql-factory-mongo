// src/mongo/context.ts

import { MongoClient } from 'mongodb';
import { getLogger } from '../utils/logger';

export interface RequestContext {
    mongo: MongoClient
    user?: { id: string;[key: string]: any }
    tenantId?: string
}

export async function createContext(mongo: MongoClient, req: any): Promise<RequestContext> {
    const logger = getLogger();
    const user = req.user || null;
    const tenantId = req.headers['x-tenant-id'] || undefined;

    if (user) logger.info?.('Context initialized with user', { userId: user.id });
    if (tenantId) logger.info?.('Context initialized with tenant', { tenantId });

    return {
        mongo,
        user,
        tenantId
    };
}
