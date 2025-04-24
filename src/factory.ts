// src/factory.ts

import { generateQueries } from './graphql/queries';
import { generateMutations } from './graphql/mutations';
import { generateSubscriptions } from './graphql/subscriptions';
import { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { registerMetadata } from './metadata/registry';
import { SchemaKey, toSchemaKeyString } from './metadata/schemaKey';
import { Metadata } from './metadata/types';
import { validateMetadata } from './metadata/validators';
import { getLogger } from './utils/logger';
import { getTracer } from './utils/tracing';


export async function createGraphQLSchema(
    name: string,
    metadata: Metadata,
    tenantId: string,
    clientApp: string
): Promise<GraphQLSchema> {
    const logger = getLogger();
    const tracer = getTracer();

    return await tracer.startSpan(`schema.createGraphQLSchema.${name}`, async () => {
        validateMetadata(name, metadata);

        const key: SchemaKey = { name, tenantId, clientApp };
        registerMetadata(key, metadata);

        const QueryType = new GraphQLObjectType({
            name: `${name}_Query`,
            fields: () => generateQueries(key, metadata)
        });

        const MutationType = new GraphQLObjectType({
            name: `${name}_Mutation`,
            fields: () => generateMutations(key, metadata)
        });

        const SubscriptionType = new GraphQLObjectType({
            name: `${name}_Subscription`,
            fields: () => generateSubscriptions(key, metadata)
        });

        logger.info(`GraphQL schema created for`, key);

        return new GraphQLSchema({
            query: QueryType,
            mutation: MutationType,
            subscription: SubscriptionType
        });
    })
}
