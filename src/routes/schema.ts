// src/routes/schema.ts

import { FastifyInstance } from 'fastify';
import { MongoClient } from 'mongodb';
import { getLogger } from '../utils/logger';
import { validateMetadata } from '../metadata/validators';
import { createFactoryAuthContext } from '../lib/authContext';
import { createGraphQLSchema } from '../factory';
import { Metadata } from '../metadata/types';

export async function registerSchemaRoutes(app: FastifyInstance, mongo: MongoClient) {
    const logger = getLogger();

    app.post('/admin/schema', async (req, reply) => {
        const { name, metadata, clientApp } = req.body as {
            name: string;
            metadata: Metadata;
            clientApp: string;
        };
        validateMetadata(name, metadata);

        const authContext = await createFactoryAuthContext(mongo)(req);
        const { tenantId } = authContext;

        if (!name || !metadata || !tenantId || !clientApp) {
            return reply.status(400).send({ error: 'Missing required fields: name, metadata, clientApp' })
        }

        const db = mongo.db('wize-configuration')
        const filter = { name, tenantId, clientApp }

        try {
            await db.collection('schemas').updateOne(
                filter,
                {
                    $set: {
                        name,
                        tenantId,
                        clientApp,
                        metadata,
                        updatedAt: new Date()
                    }
                },
                { upsert: true }
            );

            await createGraphQLSchema(name, metadata, tenantId, clientApp);
            logger.info(`Schema registered successfully`, { name, tenantId, clientApp });

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
