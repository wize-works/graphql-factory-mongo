// src/graphql/mutations.ts

import {
    GraphQLNonNull,
    GraphQLID,
    GraphQLFieldConfigMap
} from 'graphql'
import { getMetadata } from '../metadata/registry'
import { createGraphQLType } from './types'
import { createGraphQLInputType } from './inputs'
import { getLogger } from '../utils/logger'
import { getTracer } from '../utils/tracing'
import { Metadata } from '../metadata/types'
import { pluralize } from '../utils/pluralize'
import { requireScope } from '../utils/requireScope'

export function generateMutations(name: string, metadata: Metadata): GraphQLFieldConfigMap<any, any> {
    const logger = getLogger()
    const tracer = getTracer()

    const type = createGraphQLType(name, metadata)
    const inputType = createGraphQLInputType(`${name}Input`, metadata)

    return {
        [`create${name}`]: {
            type,
            args: {
                input: { type: new GraphQLNonNull(inputType) }
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${name.toLowerCase()}:create`)
                return await tracer.startSpan(`mutation.${name}.create`, async () => {
                    const db = context.mongo.db()
                    const collection = db.collection(pluralize(name.toLowerCase()))

                    if (metadata.tenantScoped && !context.tenantId) {
                        throw new Error('Missing tenantId in context')
                    }

                    const doc = {
                        ...args.input,
                        ...(metadata.tenantScoped ? { tenantId: context.tenantId } : {}),
                        createdAt: new Date(),
                        createdBy: context.user?.id || 'system'
                    }

                    const result = await collection.insertOne(doc)
                    logger.info(`Created ${name}`, { id: result.insertedId })
                    return await collection.findOne({ _id: result.insertedId })
                })
            }
        },
        [`update${name}`]: {
            type,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                input: { type: new GraphQLNonNull(inputType) }
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${name.toLowerCase()}:update`)
                return await tracer.startSpan(`mutation.${name}.update`, async () => {
                    const db = context.mongo.db()
                    const collection = db.collection(pluralize(name.toLowerCase()))

                    const filter: Record<string, any> = { _id: args.id }
                    if (metadata.tenantScoped && context.tenantId) {
                        filter.tenantId = context.tenantId
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
                    )
                    logger.info(`Updated ${name}`, { id: args.id })
                    return await collection.findOne({ _id: args.id })
                })
            }
        },
        [`delete${name}`]: {
            type,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: async (_, args, context) => {
                requireScope(context, `${name.toLowerCase()}:delete`)
                return await tracer.startSpan(`mutation.${name}.delete`, async () => {
                    const db = context.mongo.db()
                    const collection = db.collection(pluralize(name.toLowerCase()))

                    const filter: Record<string, any> = { _id: args.id }
                    if (metadata.tenantScoped && context.tenantId) {
                        filter.tenantId = context.tenantId
                    }

                    const doc = await collection.findOne(filter)
                    await collection.deleteOne(filter)
                    logger.info(`Deleted ${name}`, { id: args.id })
                    return doc
                })
            }
        }
    }
}
