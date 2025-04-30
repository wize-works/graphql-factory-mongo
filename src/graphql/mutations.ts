// src/graphql/mutations.ts

import {
    GraphQLNonNull,
    GraphQLID,
    GraphQLFieldConfigMap,
    GraphQLString,
} from 'graphql';
import { createGraphQLType } from './types';
import { createGraphQLInputType } from './inputs';
import { getLogger } from '../utils/logger';
import { getTracer } from '../utils/tracing';
import { Metadata } from '../metadata/types';
import { SchemaKey } from '../metadata/schemaKey';
import { requireScope } from '../utils/requireScope';
import { capitalizeFirstLetter } from '../utils/capitalize';
import { pluralize } from '../utils/pluralize';
import { ObjectId } from 'mongodb';

export function generateMutations(
    key: SchemaKey,
    metadata: Metadata
): GraphQLFieldConfigMap<any, any> {
    const logger = getLogger();
    const tracer = getTracer();
    const tableName = pluralize(key.table.toLowerCase());

    const type = createGraphQLType(key, metadata);
    const inputType = createGraphQLInputType(
        `${key.table}Input`,
        metadata,
        key
    );

    return {
        [`create${capitalizeFirstLetter(key.table)}`]: {
            type,
            args: {
                input: { type: new GraphQLNonNull(inputType) },
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${key.table.toLowerCase()}:create`);
                return await tracer.startSpan(
                    `mutation.${key.table}.create`,
                    async () => {
                        const db = context.mongo.db(context.database);
                        const collection = db.collection(`${tableName}`);

                        if (metadata.tenantScoped && !context.tenantId) {
                            throw new Error('Missing tenantId in context');
                        }
                        delete args.input.tenantId; // Remove tenantId from input if present
                        delete args.input._id; // Remove id from input if present

                        const doc = {
                            ...args.input,
                            //...(metadata.tenantScoped ? { tenantId: context.tenantId } : {}),
                            createdAt: new Date(),
                            createdBy: context.user?.id || 'system',
                            tenantId: context.tenantId,
                        };

                        const result = await collection.insertOne(doc);
                        logger.info?.(`Created ${key.table}`, {
                            id: result.insertedId,
                        });
                        return await collection.findOne({
                            _id: result.insertedId,
                        });
                    }
                );
            },
        },
        [`update${capitalizeFirstLetter(key.table)}`]: {
            type,
            args: {
                id: { type: new GraphQLNonNull(GraphQLString) },
                input: { type: new GraphQLNonNull(inputType) },
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${key.table.toLowerCase()}:update`);
                return await tracer.startSpan(
                    `mutation.${key.table}.update`,
                    async () => {
                        const db = context.mongo.db(context.database);
                        const collection = db.collection(`${tableName}`);

                        const filter: Record<string, any> = {
                            _id: new ObjectId(args.id),
                        };

                        delete args.input.tenantId; // Remove tenantId from input if present
                        delete args.input._id; // Remove id from input if present

                        await collection.updateOne(filter, {
                            $set: {
                                ...args.input,
                                updatedAt: new Date(),
                                updatedBy: context.user?.id || 'system',
                                tenantId: context.tenantId,
                            },
                        });
                        logger.info?.(`Updated ${key.table}`, { id: args.id });
                        return await collection.findOne({ _id: args.id });
                    }
                );
            },
        },
        [`delete${capitalizeFirstLetter(key.table)}`]: {
            type,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${key.table.toLowerCase()}:delete`);
                return await tracer.startSpan(
                    `mutation.${key.table}.delete`,
                    async () => {
                        const db = context.mongo.db(context.database);
                        const collection = db.collection(`${tableName}`);

                        const filter: Record<string, any> = {
                            _id: new ObjectId(args.id),
                        };
                        //if (metadata.tenantScoped && context.tenantId) {
                        //filter.tenantId = context.tenantId;
                        //}
                        filter.tenantId = context.tenantId;

                        const doc = await collection.findOne(filter);
                        await collection.deleteOne(filter);
                        logger.info?.(`Deleted ${key.table}`, { id: args.id });
                        return doc;
                    }
                );
            },
        },
    };
}
