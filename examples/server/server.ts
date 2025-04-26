// src/server.ts

//import './config/dotenv';

import express from 'express';
import { MongoClient } from 'mongodb';
import { createYoga } from 'graphql-yoga';
import { createServerSchema, createServerContext, registerSchemaRoutes } from '../../src';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'wize-example';
const mongoClient = new MongoClient(MONGO_URI);

(async () => {
    await mongoClient.connect();
    console.log(`Connected to MongoDB at ${MONGO_URI}`);
    const yoga = createYoga({
        graphqlEndpoint: '/graphql',
        schema: async ({request}) => createServerSchema(request, mongoClient, dbName),
        context: async ({request}) => {
            const baseContext = await createServerContext(request, mongoClient);
            return {
                ...baseContext,
                dbName, // Use the database name you want to connect to
            };
        },
        graphiql: true,
    });

    const app = express();
    app.use(express.json());

    registerSchemaRoutes(app, mongoClient, dbName);

    app.use(yoga.graphqlEndpoint, yoga);

    app.listen(port, () => {
        console.log(`🚀 wize-exammple API ready at http://localhost:${port}/graphql`);
    });
})();