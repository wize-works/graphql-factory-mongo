// src/utils/loadSchemas.ts

import { MongoClient } from 'mongodb';
import { getLogger } from './logger';

const logger = getLogger();

export async function loadSchemasFromMongo(
    mongo: MongoClient,
    tenantId: string,
    clientApp: string,
    database?: string
): Promise<Array<{ table: string; metadata: any }>> {
    logger.debug?.('Loading schemas from MongoDB', { tenantId, clientApp, database });
    const db = mongo.db('wize-configuration');
    return db
        .collection('schemas')
        .find({ tenantId, clientApp, database })
        .project({ table: 1, metadata: 1, _id: 0 })
        .toArray() as Promise<Array<{ table: string; metadata: any }>>;
}
