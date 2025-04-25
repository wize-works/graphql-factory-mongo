// src/server.ts

//import './config/dotenv';

import express from 'express';
import { MongoClient } from 'mongodb';
import { createYoga } from 'graphql-yoga';
import { createServerSchema, createServerContext, registerSchemaRoutes } from '../../src';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';

const mongoClient = new MongoClient(MONGO_URI);

(async () => {
    await mongoClient.connect();
    
    const yoga = createYoga({
        graphqlEndpoint: '/graphql',
        schema: async ({request}) => createServerSchema(request, mongoClient),
        context: async ({request}) => {
            process.env.DATABASE_NAME = 'wize-comment';
            return createServerContext(request, mongoClient);
        },
        graphiql: true,
    });

    const app = express();
    app.use(express.json());

    const schema = registerSchemaRoutes(app, mongoClient);

    // Use Yoga as middleware in Express
    app.use(yoga.graphqlEndpoint, yoga);

    app.listen(port, () => {
        console.log(`🚀 wize-comment API ready at http://localhost:${port}/graphql`);
    });
})();