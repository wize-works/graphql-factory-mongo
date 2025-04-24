// src/graphql/queries.ts

import { GraphQLFieldConfigMap, GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql';
import { createGraphQLType } from './types';
import { Metadata } from '../metadata/types';
import { getLogger } from '../utils/logger';
import { getTracer } from '../utils/tracing';
import { SchemaKey } from '../metadata/schemaKey';
import { requireScope } from '../utils/requireScope';

export function generateQueries(key: SchemaKey, metadata: Metadata): GraphQLFieldConfigMap<any, any> {
    const logger = getLogger();
    const tracer = getTracer();
    const type = createGraphQLType(key, metadata);

    return {
        [`find${key.name}ById`]: {
            type,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${key.name.toLowerCase()}:read`)
                console.log('findById: context', context);
                return await tracer.startSpan(`query.${key.name}.findById`, async () => {
                    const db = context.mongo.db();
                    const collection = db.collection(`${key.name.toLowerCase()}s`);

                    const filter: Record<string, any> = { _id: args.id };
                    if (metadata.tenantScoped && context.tenantId) {
                        filter.tenantId = context.tenantId;
                    }

                    const result = await collection.findOne(filter);
                    logger.info(`Fetched ${key.name} by ID`, { id: args.id });
                    return result;
                })
            }
        },
        [`find${key.name}`]: {
            type: new GraphQLList(type),
            resolve: async (_, __, context) => {
                requireScope(context, `${key.name.toLowerCase()}:read`)
                return await tracer.startSpan(`query.${key.name}.findAll`, async () => {
                    const db = context.mongo.db();
                    const collection = db.collection(`${key.name.toLowerCase()}s`);

                    const filter: Record<string, any> = {};
                    if (metadata.tenantScoped && context.tenantId) {
                        filter.tenantId = context.tenantId;
                    }

                    const results = await collection.find(filter).toArray();
                    logger.info(`Fetched all ${key.name}`, { count: results.length });
                    return results;
                })
            }
        }
    };
}