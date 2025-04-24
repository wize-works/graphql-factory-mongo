// src/graphql/queries.ts

import { GraphQLFieldConfigMap, GraphQLID, GraphQLList, GraphQLNonNull } from 'graphql'
import { pluralize } from '../utils/pluralize'
import { createGraphQLType } from './types'
import { Metadata } from '../metadata/types'
import { getLogger } from '../utils/logger'
import { getTracer } from '../utils/tracing'
import { requireScope } from '../utils/requireScope'

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
            resolve: async (_, args, context) => {
                requireScope(context, `${name.toLowerCase()}:read`)
                return await tracer.startSpan(`query.${name}.findById`, async () => {
                    const db = context.mongo.db()
                    const collection = db.collection(pluralize(name.toLowerCase()))

                    const filter: Record<string, any> = { _id: args.id }

                    if (metadata.tenantScoped && context.tenantId) {
                        filter.tenantId = context.tenantId
                    }

                    const result = await collection.findOne(filter)
                    logger.info(`Fetched ${name} by ID`, { id: args.id })
                    return result
                })
            }
        },
        [`find${name}`]: {
            type: new GraphQLList(type),
            resolve: async (_, __, context) => {
                requireScope(context, `${name.toLowerCase()}:read`)
                return await tracer.startSpan(`query.${name}.findAll`, async () => {
                    const db = context.mongo.db()
                    const collection = db.collection(pluralize(name.toLowerCase()))

                    const filter: Record<string, any> = {}
                    if (metadata.tenantScoped && context.tenantId) {
                        filter.tenantId = context.tenantId
                    }

                    const results = await collection.find(filter).toArray()
                    logger.info(`Fetched all ${name}`, { count: results.length })
                    return results
                })
            }
        }
    }
}
