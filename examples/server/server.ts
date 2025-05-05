import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { MongoClient } from 'mongodb';
import { createYoga } from 'graphql-yoga';
import { createServerSchema, createServerContext, registerSchemaRoutes, registerAdminRoutes } from '../../src';
import { ILogger } from '../../src';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const database = process.env.DB_NAME || 'wize-project'; // Use the database name you want to connect to
const mongoClient = new MongoClient(MONGO_URI);
let currentSchemas: any = null;

const logger: ILogger = {
    info: (message: string) => console.log(`[INFO]: ${message}`),
    error: (message: string) => console.error(`[ERROR]: ${message}`),
    warn: (message: string) => console.warn(`[WARN]: ${message}`),
    debug: (message: string) => console.debug(`[DEBUG]: ${message}`),
};

(async () => {
    await mongoClient.connect();
    logger.info?.(`Connected to MongoDB at ${MONGO_URI}`);

    const yoga = createYoga({
        graphqlEndpoint: '/graphql',
        schema: async ({ request }) => {
            try {
                if (!currentSchemas) {
                    const apiKey: string = request.headers.get('wize-api-key') || '';
                    currentSchemas = await createServerSchema(apiKey, mongoClient, database);
                }
                return currentSchemas;
            }
            catch (error) {
                logger.error?.(`Error creating schema: ${error}`);
                throw new Error('Failed to create schema');
            }
        },
        context: async ({ request }) => {
            try {
                const baseContext = await createServerContext(request, mongoClient);
                return {
                    ...baseContext,
                    database,
                };
            }
            catch (error) {
                logger.error?.(`Error creating context: ${error}`);
                throw new Error('Failed to create context');
            }
        },
        graphiql: true,
    });

    const app = express();
    app.use(express.json());

    registerSchemaRoutes(app, mongoClient, database);
    registerAdminRoutes(app, mongoClient, currentSchemas, database);

    app.use(yoga.graphqlEndpoint, yoga);

    app.listen(port, () => {
        console.log(`🚀 wize-exammple API ready at http://localhost:${port}/graphql`);
    });
})();