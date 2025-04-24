// src/graphql/inputs.ts

import {
    GraphQLInputObjectType,
    GraphQLString,
    GraphQLID,
    GraphQLBoolean,
    GraphQLInt,
    GraphQLFloat,
    GraphQLEnumType
} from 'graphql'
import { GraphQLDateTime, GraphQLDate } from 'graphql-scalars'
import { Metadata } from '../metadata/types'
import { SchemaKey, toSchemaKeyString } from '../metadata/schemaKey'
import { getLogger } from '../utils/logger'

const logger = getLogger()
const inputTypeRegistry = new Map<string, GraphQLInputObjectType>()

export function createGraphQLInputType(name: string, metadata: Metadata, key: SchemaKey): GraphQLInputObjectType {
    const cacheKey = toSchemaKeyString(key)
    if (inputTypeRegistry.has(cacheKey)) {
        return inputTypeRegistry.get(cacheKey)!
    }

    const fields = Object.entries(metadata.fields).reduce((acc, [fieldName, fieldDef]) => {
        acc[fieldName] = { type: resolveInputType(fieldDef, fieldName, key) }
        return acc
    }, {} as Record<string, any>)

    const inputType = new GraphQLInputObjectType({
        name,
        fields
    })

    logger.info(`Created GraphQLInputObjectType for`, key)
    inputTypeRegistry.set(cacheKey, inputType)
    return inputType
}

function resolveInputType(
    fieldDef: any,
    fieldName: string,
    key: SchemaKey
) {
    switch (fieldDef.type) {
        case 'uuid':
        case 'id':
            return GraphQLID
        case 'string':
        case 'text':
            return GraphQLString
        case 'datetime':
            return GraphQLDateTime
        case 'date':
            return GraphQLDate
        case 'boolean':
            return GraphQLBoolean
        case 'int':
            return GraphQLInt
        case 'float':
            return GraphQLFloat
        case 'enum':
            if (!fieldDef.values || !Array.isArray(fieldDef.values)) {
                throw new Error(`Missing or invalid enum values for ${fieldName}`)
            }
            return new GraphQLEnumType({
                name: `${key.name}_${fieldName}_Enum_Input`,
                values: fieldDef.values.reduce((acc: Record<string, { value: string }>, val: string) => {
                    acc[val.toUpperCase()] = { value: val }
                    return acc
                }, {} as Record<string, { value: string }>)
            })
        default:
            throw new Error(`Unsupported input field type: ${fieldDef.type}`)
    }
}
