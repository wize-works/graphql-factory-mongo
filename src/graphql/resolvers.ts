// src/graphql/resolvers.ts

import { GraphQLObjectType } from 'graphql';
import { generateQueries } from './queries';
import { generateMutations } from './mutations';
import { generateSubscriptions } from './subscriptions';
import { Metadata } from '../metadata/types';
import { SchemaKey } from '../metadata/schemaKey';

export function createResolvers(key: SchemaKey, metadata: Metadata): {
    query: GraphQLObjectType
    mutation: GraphQLObjectType
    subscription: GraphQLObjectType
} {
    return {
        query: new GraphQLObjectType({
            name: `${key.name}_Query`,
            fields: () => generateQueries(key, metadata)
        }),
        mutation: new GraphQLObjectType({
            name: `${key.name}_Mutation`,
            fields: () => generateMutations(key, metadata)
        }),
        subscription: new GraphQLObjectType({
            name: `${key.name}_Subscription`,
            fields: () => generateSubscriptions(key, metadata)
        })
    };
}
