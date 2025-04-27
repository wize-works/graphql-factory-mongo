// src/routes/schema.ts

import { MongoClient } from 'mongodb';
import { getLogger } from '../utils/logger';
import { validateMetadata } from '../metadata/validators';
import { createAuthContext } from '../server/authContext';
import { createGraphQLSchema } from '../factory';
import { Metadata } from '../metadata/types';
import { Request, Response } from 'express';
import { loadSchemasFromMongo } from '../utils/loadSchemas';

export async function registerSchemaRoutes(app: any, mongo: MongoClient, database: string) {
    const logger = getLogger();
    
    app.post('/admin/schema', async (req: Request, reply: Response) => {

        const apiKey = req.headers['wize-api-key']?.toString().trim();

        if (!apiKey) {
            logger.warn('Missing API key in request headers.');
            return reply.status(401).send({ error: 'Missing API key in request headers.' });
        }

        const { table, metadata, clientApp } = req.body as {
            table: string;
            metadata: Metadata;
            clientApp: string;
        };

        const tableCollection = await mongo.db('wize-configuration').collection('tables').findOne({ database });

        if (!tableCollection) {
            logger.error(`Database '${database}' not found.`);
            return reply.status(400).send({ error: `Database '${database}' not found.` });
        }

        const tables = tableCollection?.tables || [];

        const tableSchema = {
            table: "example",
            metadata: {
                fields: [
                    {
                        _id: "string",
                        name: {
                            type: "string",
                            required: true,
                        }
                    }
                ],
                subscriptions: {
                    onCreated: true,
                    onUpdated: true,
                    onDeleted: true
                }
            },
            clientApp: "example-client-app"
        };

        if (!tables.includes(table)) {
            logger.warn(`Table '${table}' is not in the available tables list in the '${database}' database.`);
            return reply.status(400).send({ error: `Table '${table}' is not in the available tables list in the '${database}' database.`, tables, "Example Schema": tableSchema });
        }

        logger.info('Received request to register schema', { table, metadata, clientApp, database });
        validateMetadata(table, metadata);

        const authContext = await createAuthContext(mongo, apiKey);
        const { tenantId } = authContext;

        if (!table || !metadata || !tenantId || !clientApp || !database) {
            logger.warn('Missing required fields: table, metadata, tenantId, clientApp, database');
            return reply.status(400).send({ error: 'Missing required fields: table, metadata, clientApp, database' })
        }

        const db = mongo.db('wize-configuration')
        const filter = { table, tenantId, clientApp, database }

        try {
            await db.collection('schemas').updateOne(
                filter,
                {
                    $set: {
                        database,
                        table: table,
                        tenantId,
                        clientApp,
                        metadata,
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );

            await createGraphQLSchema(table, metadata, tenantId, clientApp, database);
            logger.info(`Schema registered successfully`, { table, tenantId, clientApp });

            return reply.status(200).send({ message: 'Schema registered successfully' });
        } catch (err) {
            logger.error(err as Error)
            return reply.status(500).send({
                error: 'Failed to register schema',
                details: err instanceof Error ? err.message : String(err)
            });
        }
    })
}
