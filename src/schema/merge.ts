// src/utils/buildMergedSchema.ts

import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { createResolvers } from '../graphql/resolvers';
import { validateMetadata } from '../metadata/validators';
import { Metadata } from '../metadata/types';
import { SchemaKey } from '../metadata/schemaKey';

export function buildMergedSchema(
    schemas: Array<{ name: string; metadata: Metadata; tenantId: string; clientApp: string }>
): GraphQLSchema {
    const allQueryFields = {};
    const allMutationFields = {};
    const allSubscriptionFields = {};

    for (const s of schemas) {
        validateMetadata(s.name, s.metadata);

        const key: SchemaKey = {
            name: s.name,
            tenantId: s.tenantId,
            clientApp: s.clientApp
        };

        const resolvers = createResolvers(key, s.metadata);

        Object.assign(allQueryFields, resolvers.query.getFields());
        Object.assign(allMutationFields, resolvers.mutation.getFields());
        Object.assign(allSubscriptionFields, resolvers.subscription.getFields());
    }

    return new GraphQLSchema({
        query: new GraphQLObjectType({ name: 'Query', fields: allQueryFields }),
        mutation: new GraphQLObjectType({ name: 'Mutation', fields: allMutationFields }),
        subscription: new GraphQLObjectType({ name: 'Subscription', fields: allSubscriptionFields })
    });
}
