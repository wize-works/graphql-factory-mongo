import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { MongoClient } from 'mongodb';
import { createAuthContext } from './authContext';
import { loadSchemasFromMongo } from '../utils/loadSchemas';
import { buildMergedSchema } from '../schema/merge';
import { enforceSystemFields } from '../metadata/enforcement';
import { getLogger } from '../utils/logger';

const logger = getLogger();

export const createServerSchema = async (request: any, mongo: MongoClient, database: string) => {

    const apiKey = request.headers.get('wize-api-key');
    if (!apiKey) throw new Error('Missing Wize API key');

    const ctx = await createAuthContext(mongo, apiKey);

    const schemas = await loadSchemasFromMongo(mongo, ctx.tenantId, ctx.clientApp, database);

    if (!schemas) {
        logger.warn(`No schemas found for the provided apiKey: ${apiKey} and clientApp.`);
    }

    if (schemas.length === 0) {
        return new GraphQLSchema({
            query: new GraphQLObjectType({
                name: 'Query',
                fields: {
                    _empty: {
                        type: GraphQLString,
                        resolve: () => 'No schemas available for this key.'
                    }
                }
            })
        });
    }

    return buildMergedSchema(
        schemas.map((s) => ({
            ...s,
            metadata: enforceSystemFields(s.metadata),
            tenantId: ctx.tenantId,
            clientApp: ctx.clientApp,
            database: database,
        }))
    );
};
