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
import {
    createGenericFilterType,
    createGenericSortType,
    createGenericPagingType
} from './inputs';
import { Metadata } from '../metadata/types';
import { getLogger } from '../utils/logger';
import { getTracer } from '../utils/tracing';
import { SchemaKey } from '../metadata/schemaKey';
import { requireScope } from '../utils/requireScope';
import { applyMongoFilters } from '../utils/applyMongoFilters';
import { capitalizeFirstLetter } from '../utils/capitalize';
import { pluralize } from '../utils/pluralize';
import { ObjectId } from 'mongodb';

export function generateQueries(key: SchemaKey, metadata: Metadata): GraphQLFieldConfigMap<any, any> {
    const logger = getLogger();
    const tracer = getTracer();
    const type = createGraphQLType(key, metadata);

    // Use generic types for filter, sort, and paging
    const filterType = createGenericFilterType(metadata, key);
    const sortType = createGenericSortType(metadata);
    const pagingType = createGenericPagingType();

    const tableName = pluralize(key.table.toLowerCase());
    const capitalizedTable = capitalizeFirstLetter(key.table);

    const ListResultType = new GraphQLObjectType({
        name: `${capitalizedTable}ListResult`,
        fields: {
            count: { type: GraphQLInt },
            data: { type: new GraphQLList(type) }
        }
    });

    return {
        [`find${capitalizeFirstLetter(key.table)}ById`]: {
            type,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${key.table.toLowerCase()}:read`);
                return await tracer.startSpan(`query.${key.table}.findById`, async () => {
                    const db = context.mongo.db(context.database);
                    const collection = db.collection(`${tableName}`);

                    const filter: Record<string, any> = { _id: new ObjectId(args.id) };
                    filter.tenantId = context.tenantId;

                    const result = await collection.findOne(filter);
                    logger.info?.(`Fetched ${key.table} by ID`, { id: args.id });
                    return result;
                });
            }
        },
        [`find${pluralize(capitalizeFirstLetter(key.table))}`]: {
            type: ListResultType,
            args: {
                filter: { type: filterType },
                sort: { type: sortType },
                paging: { type: pagingType }
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${key.table.toLowerCase()}:read`);
                return await tracer.startSpan(`query.${key.table}.findAll`, async () => {
                    const db = context.mongo.db(context.database);
                    const collection = db.collection(`${tableName}`);

                    const mongoFilter = applyMongoFilters(args.filter, metadata);
                    mongoFilter.tenantId = context.tenantId;
                    logger.debug?.('Applied mongo filters', { mongoFilter });

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

                    logger.info?.(`Fetched ${data.length} ${key.table}`, { count });
                    return { count, data };
                });
            }
        }
    };
}
