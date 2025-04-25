// src/graphql/queries.ts

import {
    GraphQLFieldConfigMap,
    GraphQLID,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLObjectType
} from 'graphql';
import { createGraphQLType } from './types';
import { createGraphQLInputType, PagingInput } from './inputs';
import { Metadata } from '../metadata/types';
import { getLogger } from '../utils/logger';
import { getTracer } from '../utils/tracing';
import { SchemaKey } from '../metadata/schemaKey';
import { requireScope } from '../utils/requireScope';
import { applyMongoFilters } from '../utils/applyMongoFilters';

export function generateQueries(key: SchemaKey, metadata: Metadata): GraphQLFieldConfigMap<any, any> {
    const logger = getLogger();
    const tracer = getTracer();
    const type = createGraphQLType(key, metadata);
    const filterType = createGraphQLInputType(key.name, metadata, key, 'filter');
    const sortType = createGraphQLInputType(key.name, metadata, key, 'sort');

    const ListResultType = new GraphQLObjectType({
        name: `${key.name}ListResult`,
        fields: {
            count: { type: GraphQLInt },
            data: { type: new GraphQLList(type) }
        }
    });

    return {
        [`find${key.name}ById`]: {
            type,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${key.name.toLowerCase()}:read`);
                return await tracer.startSpan(`query.${key.name}.findById`, async () => {
                    const db = context.mongo.db(process.env.DATABASE_NAME);
                    const collection = db.collection(`${key.name.toLowerCase()}`);

                    const filter: Record<string, any> = { _id: args.id };
                    if (metadata.tenantScoped && context.tenantId) {
                        filter.tenantId = context.tenantId;
                    }

                    const result = await collection.findOne(filter);
                    logger.info(`Fetched ${key.name} by ID`, { id: args.id });
                    return result;
                });
            }
        },
        [`find${key.name}`]: {
            type: ListResultType,
            args: {
                filter: { type: filterType },
                sort: { type: sortType },
                paging: { type: PagingInput }
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${key.name.toLowerCase()}:read`);
                return await tracer.startSpan(`query.${key.name}.findAll`, async () => {
                    const db = context.mongo.db(process.env.DATABASE_NAME);
                    const collection = db.collection(`${key.name.toLowerCase()}`);
                    
                    const mongoFilter = applyMongoFilters(args.filter, metadata);
                    if (metadata.tenantScoped && context.tenantId) {
                        mongoFilter.tenantId = context.tenantId;
                    }

                    const options: any = {};
                    if (args.sort) {
                        options.sort = Object.entries(args.sort).reduce<Record<string, 1 | -1>>((acc, [field, dir]) => {
                            acc[field] = dir === 'asc' ? 1 : -1;
                            return acc;
                        }, {})
                    }

                    const cursor = collection.find(mongoFilter, options).collation({ locale: 'en', strength: 2 });

                    if (args.paging) {
                        if (args.paging.offset) cursor.skip(args.paging.offset);
                        if (args.paging.limit) cursor.limit(args.paging.limit);
                    }

                    const [data, count] = await Promise.all([
                        cursor.toArray(),
                        collection.countDocuments(mongoFilter)
                    ]);

                    logger.info(`Fetched ${data.length} ${key.name}`, { count });
                    return { count, data };
                });
            }
        }
    };
}
