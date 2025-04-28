// src/graphql/subscriptions.ts

import { GraphQLFieldConfigMap } from 'graphql';
import { createGraphQLType } from './types';
import { pubsub } from '../pubsub';
import { getLogger } from '../utils/logger';
import { getTracer } from '../utils/tracing';
import { requireScope } from '../utils/requireScope';
import { SchemaKey } from '../metadata/schemaKey';
import { Metadata } from '../metadata/types';
import { capitalizeFirstLetter } from '../utils/capitalize';

export function generateSubscriptions(key: SchemaKey, metadata: Metadata): GraphQLFieldConfigMap<any, any> {
    const logger = getLogger();
    const tracer = getTracer();
    const type = createGraphQLType(key, metadata);
    const fields: GraphQLFieldConfigMap<any, any> = {};

    if (metadata.subscriptions?.onCreated) {
        fields[`on${capitalizeFirstLetter(key.table)}Created`] = {
            type,
            subscribe: (_, __, context) => {
                requireScope(context, `${key.table.toLowerCase()}:subscribe`);
                logger.info?.(`Subscribed: on${key.table}Created`);
                return pubsub.asyncIterableIterator(`${key.table}_CREATED`);
            },
            resolve: (payload: any) => payload
        }
    }

    if (metadata.subscriptions?.onUpdated) {
        fields[`on${capitalizeFirstLetter(key.table)}Updated`] = {
            type,
            subscribe: (_, __, context) => {
                requireScope(context, `${key.table.toLowerCase()}:subscribe`);
                logger.info?.(`Subscribed: on${key.table}Updated`);
                return pubsub.asyncIterableIterator(`${key.table}_UPDATED`);
            },
            resolve: (payload: any) => payload
        }
    }

    if (metadata.subscriptions?.onDeleted) {
        fields[`on${capitalizeFirstLetter(key.table)}Deleted`] = {
            type,
            subscribe: (_, __, context) => {
                requireScope(context, `${key.table.toLowerCase()}:subscribe`);
                logger.info?.(`Subscribed: on${key.table}Deleted`);
                return pubsub.asyncIterableIterator(`${key.table}_DELETED`);
            },
            resolve: (payload: any) => payload
        }
    }

    return fields;
}
