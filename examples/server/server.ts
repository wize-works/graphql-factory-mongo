import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { MongoClient } from 'mongodb';
import { createYoga } from 'graphql-yoga';
import { createServerSchema, createServerContext, registerSchemaRoutes } from '../../src';
import { ILogger } from '../../src';
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const database = process.env.DB_NAME || 'wize-example'; // Use the database name you want to connect to
const mongoClient = new MongoClient(MONGO_URI);

const logger: ILogger = {
    info: (message: string) => console.log(`[INFO]: ${message}`),
    error: (message: string) => console.error(`[ERROR]: ${message}`),
    warn: (message: string) => console.warn(`[WARN]: ${message}`),
    debug: (message: string) => console.debug(`[DEBUG]: ${message}`),
};

(async () => {
    await mongoClient.connect();
    logger.info(`Connected to MongoDB at ${MONGO_URI}`);
    
    const yoga = createYoga({
        graphqlEndpoint: '/graphql',
        schema: async ({request}) => {
            console.log('creating schema...');
            return createServerSchema(request, mongoClient, database);
        },
        context: async ({request}) => {
            console.log('creating context...');
            const baseContext = await createServerContext(request, mongoClient);
            return {
                ...baseContext,
                database,
            };
        },
        graphiql: true,
    });

    const app = express();
    app.use(express.json());

    registerSchemaRoutes(app, mongoClient, database);

    app.use(yoga.graphqlEndpoint, yoga);

    app.listen(port, () => {
        console.log(`🚀 wize-exammple API ready at http://localhost:${port}/graphql`);
    });
})();
// Global error handler
process.on('uncaughtException', (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    console.error(err);
    process.exit(1); // Exit the process to avoid undefined behavior
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
    console.error(reason);
    // Optionally exit the process if necessary
});