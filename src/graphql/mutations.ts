// src/graphql/mutations.ts

import {
    GraphQLNonNull,
    GraphQLID,
    GraphQLFieldConfigMap
} from 'graphql';
import { createGraphQLType } from './types';
import { createGraphQLInputType } from './inputs';
import { getLogger } from '../utils/logger';
import { getTracer } from '../utils/tracing';
import { Metadata } from '../metadata/types';
import { SchemaKey } from '../metadata/schemaKey';
import { requireScope } from '../utils/requireScope';

export function generateMutations(key: SchemaKey, metadata: Metadata): GraphQLFieldConfigMap<any, any> {
    const logger = getLogger();
    const tracer = getTracer();

    const type = createGraphQLType(key, metadata);
    const inputType = createGraphQLInputType(`${key.name}Input`, metadata, key);

    return {
        [`create${key.name}`]: {
            type,
            args: {
                input: { type: new GraphQLNonNull(inputType) }
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${key.name.toLowerCase()}:create`);
                return await tracer.startSpan(`mutation.${key.name}.create`, async () => {
                    const db = context.mongo.db(process.env.DATABASE_NAME);
                    const collection = db.collection(`${key.name.toLowerCase()}s`);

                    if (metadata.tenantScoped && !context.tenantId) {
                        throw new Error('Missing tenantId in context');
                    }

                    const doc = {
                        ...args.input,
                        ...(metadata.tenantScoped ? { tenantId: context.tenantId } : {}),
                        createdAt: new Date(),
                        createdBy: context.user?.id || 'system'
                    };

                    const result = await collection.insertOne(doc);
                    logger.info(`Created ${key.name}`, { id: result.insertedId });
                    return await collection.findOne({ _id: result.insertedId });
                });
            }
        },
        [`update${key.name}`]: {
            type,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                input: { type: new GraphQLNonNull(inputType) }
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${key.name.toLowerCase()}:update`);
                return await tracer.startSpan(`mutation.${key.name}.update`, async () => {
                    const db = context.mongo.db(process.env.DATABASE_NAME);
                    const collection = db.collection(`${key.name.toLowerCase()}s`);

                    const filter: Record<string, any> = { _id: args.id };
                    if (metadata.tenantScoped && context.tenantId) {
                        filter.tenantId = context.tenantId;
                    }

                    await collection.updateOne(
                        filter,
                        {
                            $set: {
                                ...args.input,
                                updatedAt: new Date(),
                                updatedBy: context.user?.id || 'system'
                            }
                        }
                    );
                    logger.info(`Updated ${key.name}`, { id: args.id });
                    return await collection.findOne({ _id: args.id });
                })
            }
        },
        [`delete${key.name}`]: {
            type,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${key.name.toLowerCase()}:delete`);
                return await tracer.startSpan(`mutation.${key.name}.delete`, async () => {
                    const db = context.mongo.db(process.env.DATABASE_NAME);
                    const collection = db.collection(`${key.name.toLowerCase()}s`);

                    const filter: Record<string, any> = { _id: args.id };
                    if (metadata.tenantScoped && context.tenantId) {
                        filter.tenantId = context.tenantId;
                    }

                    const doc = await collection.findOne(filter);
                    await collection.deleteOne(filter);
                    logger.info(`Deleted ${key.name}`, { id: args.id });
                    return doc;
                })
            }
        }
    }
}
