// src/utils/buildMergedSchema.ts

import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { createResolvers } from '../graphql/resolvers';
import { validateMetadata } from '../metadata/validators';
import { Metadata } from '../metadata/types';
import { SchemaKey } from '../metadata/schemaKey';

export function buildMergedSchema(
    schemas: Array<{ name: string; metadata: Metadata; tenantId: string; clientApp: string }>
): GraphQLSchema {
    const allQuerys = [];
    const allMutations = [];
    const allSubscriptions = [];

    for (const s of schemas) {
        validateMetadata(s.name, s.metadata);

        const key: SchemaKey = {
            name: s.name,
            tenantId: s.tenantId,
            clientApp: s.clientApp
        };

        const resolvers = createResolvers(key, s.metadata);
        
        for (const [fieldName, fieldConfig] of Object.entries(resolvers.query.getFields())) {
            if (fieldConfig && typeof fieldConfig.args !== 'object' || Array.isArray(fieldConfig.args)) {
                console.error(`❌ Invalid args for query '${fieldName}':`, fieldConfig.args);
            }
        }

        allQuerys.push(resolvers.query);
        allMutations.push(resolvers.mutation);
        allSubscriptions.push(resolvers.subscription);
    }

    function mergeFields(types: GraphQLObjectType[]) {
        return () => types.reduce((acc, type) => ({
            ...acc,
            ...type.getFields()
        }), {});
    }
    return new GraphQLSchema({
        query: new GraphQLObjectType({ name: 'Query', fields: mergeFields(allQuerys) }),
        mutation: new GraphQLObjectType({ name: 'Mutation', fields: mergeFields(allMutations) }),
        subscription: new GraphQLObjectType({ name: 'Subscription', fields: mergeFields(allSubscriptions) })
    });
}
