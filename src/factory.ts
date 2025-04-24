// src/factory.ts

import { createGraphQLType } from './graphql/types';
import { createGraphQLInputType } from './graphql/inputs';
import { generateQueries } from './graphql/queries';
import { generateMutations } from './graphql/mutations';
import { generateSubscriptions } from './graphql/subscriptions';
import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { registerMetadata } from './metadata/registry';
import { Metadata } from './metadata/types';
import { validateMetadata } from './metadata/validators';
import { getLogger } from './utils/logger';
import { getTracer } from './utils/tracing';
import { wrapSpan } from './utils/wrapSpan';

export async function createGraphQLSchema(name: string, metadata: Metadata): Promise<GraphQLSchema> {
    const logger = getLogger();

    return await wrapSpan(`schema.createGraphQLSchema.${name}`, async () => {
        validateMetadata(name, metadata);
        registerMetadata(name, metadata);

        const QueryType = new GraphQLObjectType({
            name: `${name}_Query`,
            fields: () => generateQueries(name, metadata)
        });

        const MutationType = new GraphQLObjectType({
            name: `${name}_Mutation`,
            fields: () => generateMutations(name, metadata)
        });

        const SubscriptionType = new GraphQLObjectType({
            name: `${name}_Subscription`,
            fields: () => generateSubscriptions(name, metadata)
        });

        logger.info(`GraphQL schema created for ${name}`);

        return new GraphQLSchema({
            query: QueryType,
            mutation: MutationType,
            subscription: SubscriptionType
        })
    });
}