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

function coerceInputValues(input: Record<string, any>, metadata: Metadata): Record<string, any> {
    const output: Record<string, any> = {};

    for (const [key, value] of Object.entries(input)) {
        const field = metadata.fields?.[key];
        if (!field) {
            output[key] = value;
            continue;
        }

        const type = field.type;

        if ((type === 'int' || type === 'number') && typeof value === 'string') {
            const coerced = Number(value);
            output[key] = isNaN(coerced) ? null : coerced;
        } else if (value === '' && !field.required) {
            output[key] = null;
        } else {
            output[key] = value;
        }
    }

    return output;
}

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
                logger.info?.(`Creating ${key.table}`, { input: args.input });
                try {
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

                            const sanitizedInput = coerceInputValues(args.input, metadata);
                            logger.info?.(`Sanitized input`, { sanitizedInput });

                            const doc = {
                                ...sanitizedInput,
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
                } catch (error) {
                    logger.error?.(`Error creating ${key.table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    if (error instanceof Error) {
                        throw new Error(`Failed to create ${key.table}: ${error.message}`);
                    }
                    throw new Error(`Failed to create ${key.table}: An unknown error occurred`);
                }
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
                try {
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

                            const sanitizedInput = coerceInputValues(args.input, metadata);

                            await collection.updateOne(filter, {
                                $set: {
                                    ...sanitizedInput,
                                    updatedAt: new Date(),
                                    updatedBy: context.user?.id || 'system',
                                    tenantId: context.tenantId,
                                },
                            });
                            logger.info?.(`Updated ${key.table}`, { id: args.id });
                            return await collection.findOne({ _id: new ObjectId(args.id) });
                        }
                    );
                } catch (error) {
                    logger.error?.(`Error updating ${key.table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                    if (error instanceof Error) {
                        throw new Error(`Failed to update ${key.table}: ${error.message}`);
                    }
                    throw new Error(`Failed to update ${key.table}: An unknown error occurred`);
                }
            },
        },
        [`delete${capitalizeFirstLetter(key.table)}`]: {
            type,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${key.table.toLowerCase()}:delete`);
                try {
                    return await tracer.startSpan(
                        `mutation.${key.table}.delete`,
                        async () => {
                            const db = context.mongo.db(context.database);
                            const collection = db.collection(`${tableName}`);

                            const filter: Record<string, any> = {
                                _id: new ObjectId(args.id),
                                tenantId: context.tenantId,
                            };

                            const doc = await collection.findOne(filter);
                            if (!doc) {
                                throw new Error(`${key.table} with ID ${args.id} not found`);
                            }

                            await collection.deleteOne(filter);
                            logger.info?.(`Deleted ${key.table}`, { id: args.id });
                            return doc;
                        }
                    );
                } catch (error) {
                    if (error instanceof Error) {
                        logger.error?.(`Error deleting ${key.table}: ${error.message}`);
                    } else {
                        logger.error?.(`Error deleting ${key.table}: Unknown error`);
                    }
                    throw new Error(`Failed to delete ${key.table}: ${error instanceof Error ? error.message : 'Unknown error'}`);
                }
            },
        },
    };
}
