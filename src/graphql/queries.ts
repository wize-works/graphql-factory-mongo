// src/graphql/queries.ts

import { GraphQLFieldConfigMap, GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql'
import { createGraphQLType } from './types'
import { getMetadata } from '../metadata/registry'
import { getLogger } from '../utils/logger'
import { getTracer } from '../utils/tracing'
import { Metadata } from '../metadata/types'

export function generateQueries(name: string, metadata: Metadata): GraphQLFieldConfigMap<any, any> {
    const logger = getLogger()
    const tracer = getTracer()
    const type = createGraphQLType(name, metadata)

    return {
        [`find${name}ById`]: {
            type,
            args: {
                id: { type: new GraphQLNonNull(GraphQLID) }
            },
            resolve: async (_, args, context) =>
                tracer.startSpan(`query.${name}.findById`, async () => {
                    const db = context.mongo.db()
                    const collection = db.collection(name.toLowerCase() + 's')
                    const result = await collection.findOne({ _id: args.id })
                    logger.info(`Fetched ${name} by ID`, { id: args.id })
                    return result
                })
        },
        [`find${name}`]: {
            type: new GraphQLList(type),
            resolve: async (_, __, context) =>
                tracer.startSpan(`query.${name}.findAll`, async () => {
                    const db = context.mongo.db()
                    const collection = db.collection(name.toLowerCase() + 's')
                    const results = await collection.find().toArray()
                    logger.info(`Fetched all ${name}`)
                    return results
                })
        }
    }
}
