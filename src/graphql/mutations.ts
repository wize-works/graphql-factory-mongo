// src/graphql/mutations.ts

import {
    GraphQLNonNull,
    GraphQLID,
    GraphQLFieldConfigMap,
    GraphQLInputObjectType,
    GraphQLString
} from 'graphql'
import { getMetadata } from '../metadata/registry'
import { createGraphQLType } from './types'
import { createGraphQLInputType } from './inputs'
import { getLogger } from '../utils/logger'
import { getTracer } from '../utils/tracing'
import { Metadata } from '../metadata/types'

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
            resolve: async (_, args, context) =>
                tracer.startSpan(`mutation.${name}.create`, async () => {
                    const db = context.mongo.db()
                    const collection = db.collection(name.toLowerCase() + 's')
                    const result = await collection.insertOne({
                        ...args.input,
                        createdAt: new Date(),
                        createdBy: context.user?.id || 'system'
                    })
                    const doc = await collection.findOne({ _id: result.insertedId })
                    logger.info(`Created ${name}`, { id: result.insertedId })
                    return doc
                })
        },
        [`update${name}`]: {
            type,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) },
                input: { type: new GraphQLNonNull(inputType) }
            },
            resolve: async (_, args, context) =>
                tracer.startSpan(`mutation.${name}.update`, async () => {
                    const db = context.mongo.db()
                    const collection = db.collection(name.toLowerCase() + 's')
                    await collection.updateOne(
                        { _id: args.id },
                        {
                            $set: {
                                ...args.input,
                                updatedAt: new Date(),
                                updatedBy: context.user?.id || 'system'
                            }
                        }
                    )
                    const updated = await collection.findOne({ _id: args.id })
                    logger.info(`Updated ${name}`, { id: args.id })
                    return updated
                })
        },
        [`delete${name}`]: {
            type,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: async (_, args, context) =>
                tracer.startSpan(`mutation.${name}.delete`, async () => {
                    const db = context.mongo.db()
                    const collection = db.collection(name.toLowerCase() + 's')
                    const doc = await collection.findOne({ _id: args.id })
                    await collection.deleteOne({ _id: args.id })
                    logger.info(`Deleted ${name}`, { id: args.id })
                    return doc
                })
        }
    }
}
