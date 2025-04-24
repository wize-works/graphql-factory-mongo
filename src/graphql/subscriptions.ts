// src/graphql/subscriptions.ts

import { GraphQLFieldConfigMap } from 'graphql';
import { createGraphQLType } from './types';
import { pubsub } from '../pubsub';
import { getLogger } from '../utils/logger';
import { getTracer } from '../utils/tracing';
import { requireScope } from '../utils/requireScope';
import { SchemaKey } from '../metadata/schemaKey';
import { Metadata } from '../metadata/types';

export function generateSubscriptions(key: SchemaKey, metadata: Metadata): GraphQLFieldConfigMap<any, any> {
    const logger = getLogger();
    const tracer = getTracer();
    const type = createGraphQLType(key, metadata);
    const fields: GraphQLFieldConfigMap<any, any> = {};

    if (metadata.subscriptions?.onCreated) {
        fields[`on${key.name}Created`] = {
            type,
            subscribe: (_, __, context) => {
                requireScope(context, `${key.name.toLowerCase()}:subscribe`);
                logger.info(`Subscribed: on${key.name}Created`);
                return pubsub.asyncIterableIterator(`${key.name}_CREATED`);
            },
            resolve: (payload: any) => payload
        }
    }

    if (metadata.subscriptions?.onUpdated) {
        fields[`on${key.name}Updated`] = {
            type,
            subscribe: (_, __, context) => {
                requireScope(context, `${key.name.toLowerCase()}:subscribe`);
                logger.info(`Subscribed: on${key.name}Updated`);
                return pubsub.asyncIterableIterator(`${key.name}_UPDATED`);
            },
            resolve: (payload: any) => payload
        }
    }

    if (metadata.subscriptions?.onDeleted) {
        fields[`on${key.name}Deleted`] = {
            type,
            subscribe: (_, __, context) => {
                requireScope(context, `${key.name.toLowerCase()}:subscribe`);
                logger.info(`Subscribed: on${key.name}Deleted`);
                return pubsub.asyncIterableIterator(`${key.name}_DELETED`);
            },
            resolve: (payload: any) => payload
        }
    }

    return fields;
}
