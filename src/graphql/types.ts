// src/graphql/types.ts

import {
    GraphQLObjectType,
    GraphQLString,
    GraphQLID,
    GraphQLBoolean,
    GraphQLInt,
    GraphQLFloat,
    GraphQLEnumType,
    GraphQLList,
    GraphQLType,
} from 'graphql';
import { GraphQLDateTime, GraphQLDate } from 'graphql-scalars';
import { Metadata } from '../metadata/types';
import { SchemaKey, toSchemaKeyString } from '../metadata/schemaKey';
import { getLogger } from '../utils/logger';

const logger = getLogger();
const typeRegistry = new Map<string, GraphQLObjectType>();

export function createGraphQLType(
    key: SchemaKey,
    metadata: Metadata
): GraphQLObjectType {
    const cacheKey = toSchemaKeyString(key);
    if (typeRegistry.has(cacheKey)) {
        return typeRegistry.get(cacheKey)!;
    }

    const fields = Object.entries(metadata.fields).reduce(
        (acc: Record<string, any>, [fieldName, fieldDef]) => {
            if (fieldDef.systemReserved) {
                return acc;
            }

            acc[fieldName] = {
                type: resolveGraphQLType(fieldDef, fieldName, key),
            };
            return acc;
        },
        {}
    );

    const type = new GraphQLObjectType({
        name: `${key.table}`,
        fields,
    });

    logger.info?.(`Created GraphQLObjectType for`, key);
    typeRegistry.set(cacheKey, type);
    return type;
}

function resolveGraphQLType(fieldDef: any, fieldName: string, key: SchemaKey): GraphQLType {
    switch (fieldDef.type) {
        case 'uuid':
        case 'id':
            return GraphQLID;
        case 'json':
        case 'string':
        case 'text':
            return GraphQLString;
        case 'datetime':
            return GraphQLDateTime;
        case 'date':
            return GraphQLDate;
        case 'time':
            return GraphQLString;
        case 'boolean':
            return GraphQLBoolean;
        case 'number':
        case 'integer':
        case 'int':
            return GraphQLInt;
        case 'float':
        case 'double':
        case 'decimal':
            return GraphQLFloat;
        case 'array':
            if (!fieldDef.items) {
                throw new Error(`Missing items for array field ${fieldName}`);
            }
            const itemType: GraphQLType = resolveGraphQLType(fieldDef.items, fieldName, key);
            return new GraphQLList(itemType);
        case 'enum':
            if (!fieldDef.values || !Array.isArray(fieldDef.values)) {
                throw new Error(
                    `Missing or invalid enum values for ${fieldName}`
                );
            }

            const enumSuffix = fieldDef.modeSuffix
                ? `_${fieldDef.modeSuffix}`
                : '';

            return new GraphQLEnumType({
                name: `${key.table}_${fieldName}_Enum${enumSuffix}`,
                values: fieldDef.values.reduce(
                    (acc: Record<string, { value: string }>, val: string) => {
                        acc[val.trim().replace(' ', '_').toLowerCase()] = {
                            value: val,
                        };
                        return acc;
                    },
                    {}
                ),
            });
        default:
            throw new Error(`Unsupported field type: ${fieldDef.type}`);
    }
}

export function clearTypeRegistry() {
    typeRegistry.clear();
    logger.debug?.('Cleared type registry');
}
