// src/utils/loadSchemas.ts

import { MongoClient } from 'mongodb';

export async function loadSchemasFromMongo(
    mongo: MongoClient,
    tenantId: string,
    clientApp: string
): Promise<Array<{ name: string; metadata: any }>> {
    const db = mongo.db('wize-configuration');
    return db
        .collection('schemas')
        .find({ tenantId, clientApp })
        .project({ name: 1, metadata: 1, _id: 0 })
        .toArray() as Promise<Array<{ name: string; metadata: any }>>;
}
