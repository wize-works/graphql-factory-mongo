import { GraphQLObjectType, GraphQLSchema, GraphQLString } from 'graphql';
import { MongoClient } from 'mongodb';
import { createFactoryAuthContext } from '../lib/authContext';
import { loadSchemasFromMongo } from '../utils/loadSchemas';
import { buildMergedSchema } from '../schema/merge';

export const createSchema = async (request: Request, mongo: MongoClient) => {
    const apiKey = request.headers.get('wize-api-key');
    if (!apiKey) throw new Error('Missing Wize API key');

    const ctx = await createFactoryAuthContext(mongo, apiKey);
    const schemas = await loadSchemasFromMongo(mongo, ctx.tenantId, ctx.clientApp);

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
            tenantId: ctx.tenantId,
            clientApp: ctx.clientApp
        }))
    );
};
