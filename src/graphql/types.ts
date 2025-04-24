// src/graphql/types.ts

import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLFloat,
    GraphQLBoolean,
    GraphQLID,
    GraphQLScalarType,
    GraphQLFieldConfigMap
} from 'graphql'
import { GraphQLDateTime } from 'graphql-scalars'
import { getMetadata } from '../metadata/registry'
import { Metadata } from '../metadata/types'
import { getLogger } from '../utils/logger'
import { getTracer } from '../utils/tracing'

const scalarMap: Record<string, GraphQLScalarType> = {
    string: GraphQLString,
    text: GraphQLString,
    number: GraphQLFloat,
    boolean: GraphQLBoolean,
    uuid: GraphQLID,
    datetime: GraphQLDateTime,
    json: GraphQLString // can extend with GraphQLJSON
}

export function createGraphQLType(name: string, metadata: Metadata): GraphQLObjectType {
    const logger = getLogger()
    const tracer = getTracer()

    tracer.startSpan(`types.createGraphQLType.${name}`, () => {
        logger.info(`Generating GraphQLObjectType for ${name}`)
    })

    const fields: GraphQLFieldConfigMap<any, any> = {}

    for (const [fieldName, def] of Object.entries(metadata.fields)) {
        if (def.relation) {
            fields[fieldName] = {
                type: (() => {
                    const related = getMetadata(def.relation!.model)
                    return createGraphQLType(def.relation!.model, related)
                })(),
                resolve: async (parent: any, _, context) => {
                    const db = context.mongo.db()
                    const collection = db.collection(def.relation!.model.toLowerCase() + 's')
                    return await collection.findOne({
                        [def.relation!.foreignField || '_id']: parent[def.relation!.localField || fieldName]
                    })
                }
            }
        } else {
            fields[fieldName] = {
                type: scalarMap[def.type],
                description: def.description
            }
        }
    }

    return new GraphQLObjectType({
        name,
        fields: () => fields
    })
}
