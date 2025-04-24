// src/graphql/inputs.ts

import { getLogger, getTracer } from '../utils/logger'


import {
    GraphQLInputObjectType,
    GraphQLString,
    GraphQLFloat,
    GraphQLBoolean,
    GraphQLID,
    GraphQLScalarType,
    GraphQLInputFieldConfigMap
} from 'graphql'
import { GraphQLDateTime } from 'graphql-scalars'
import { Metadata } from '../metadata/types'

const scalarMap: Record<string, GraphQLScalarType> = {
    string: GraphQLString,
    text: GraphQLString,
    number: GraphQLFloat,
    boolean: GraphQLBoolean,
    uuid: GraphQLID,
    datetime: GraphQLDateTime,
    json: GraphQLString // optionally upgrade to GraphQLJSON
}

export function createGraphQLInputType(name: string, metadata: Metadata): GraphQLInputObjectType {
    const logger = getLogger()
    const tracer = getTracer()

    return tracer.startSpan(`inputs.createInputType.${name}`, async () => {
        const fields: GraphQLInputFieldConfigMap = {}

        for (const [fieldName, def] of Object.entries(metadata.fields)) {
            if (!def.relation) {
                fields[fieldName] = {
                    type: scalarMap[def.type],
                    description: def.description
                }
            }
        }

        return new GraphQLInputObjectType({
            name,
            fields: () => fields
        })
    })
}