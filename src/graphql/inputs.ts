// src/graphql/inputs.ts

import {
    GraphQLInputObjectType,
    GraphQLString,
    GraphQLID,
    GraphQLBoolean,
    GraphQLInt,
    GraphQLFloat,
    GraphQLEnumType,
    GraphQLList,
    GraphQLNonNull,
    GraphQLInputType,
} from 'graphql';
import { GraphQLDateTime, GraphQLDate } from 'graphql-scalars';
import { Metadata } from '../metadata/types';
import { SchemaKey, toSchemaKeyString } from '../metadata/schemaKey';
import { getLogger } from '../utils/logger';
import { capitalizeFirstLetter } from '../utils/capitalize';

const logger = getLogger();
const inputTypeRegistry = new Map<string, GraphQLInputObjectType>();

export function createGraphQLInputType(
    name: string,
    metadata: Metadata,
    key: SchemaKey,
    mode: 'input' | 'filter' | 'sort' = 'input'
): GraphQLInputObjectType {
    const cacheKey = `${toSchemaKeyString(key)}:${mode}`;
    if (inputTypeRegistry.has(cacheKey)) {
        return inputTypeRegistry.get(cacheKey)!;
    }

    const fields = Object.entries(metadata.fields).reduce(
        (acc, [fieldName, fieldDef]) => {
            if (fieldDef.systemReserved) {
                return acc; // Skip system reserved fields
            }
            if (mode === 'sort') {
                acc[fieldName] = {
                    type: new GraphQLEnumType({
                        name: `${name}_${fieldName}_SortOrder`,
                        values: {
                            ASC: { value: 'asc' },
                            DESC: { value: 'desc' },
                        },
                    }),
                };
            } else if (mode === 'filter') {
                const baseType = resolveInputType(
                    fieldDef,
                    fieldName,
                    key,
                    mode
                );
                acc[fieldName + '_eq'] = { type: baseType };
                acc[fieldName + '_neq'] = { type: baseType };
                if (['string', 'text'].includes(fieldDef.type)) {
                    acc[fieldName + '_contains'] = { type: baseType };
                    acc[fieldName + '_startsWith'] = { type: baseType };
                    acc[fieldName + '_endsWith'] = { type: baseType };
                }
                if (
                    ['int', 'float', 'datetime', 'date'].includes(fieldDef.type)
                ) {
                    acc[fieldName + '_lt'] = { type: baseType };
                    acc[fieldName + '_lte'] = { type: baseType };
                    acc[fieldName + '_gt'] = { type: baseType };
                    acc[fieldName + '_gte'] = { type: baseType };
                }
                if (fieldDef.type === 'enum') {
                    acc[fieldName + '_in'] = { type: new GraphQLList(baseType) }; // Add _in for enums
                }
            } else {
                acc[fieldName] = {
                    type: resolveInputType(fieldDef, fieldName, key, mode),
                };
            }
            return acc;
        },
        {} as Record<string, any>
    );

    const inputType = new GraphQLInputObjectType({
        name: `${capitalizeFirstLetter(name)}${capitalizeFirstLetter(mode)}`,
        fields,
    });

    //logger.debug?.(`Created GraphQLInputObjectType for`, { key, mode} )
    inputTypeRegistry.set(cacheKey, inputType);
    return inputType;
}

function resolveInputType(
    fieldDef: any,
    fieldName: string,
    key: SchemaKey,
    mode: 'input' | 'filter' | 'sort'
): GraphQLInputType {
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
            return GraphQLString; // Time is treated as string for input
        case 'timestamp':
            return GraphQLString; // Timestamp is treated as string for input
        case 'boolean':
            return GraphQLBoolean;
        case 'int':
        case 'integer':
        case 'number':
            return GraphQLInt;
        case 'float':
            return GraphQLFloat;
        case 'decimal':
        case 'double':
            return GraphQLFloat; // Decimal/Double is treated as float for input
        case 'array':
            if (!fieldDef.items) {
                throw new Error(`Missing items for array field ${fieldName}`);
            }
            const itemType: GraphQLInputType = resolveInputType(fieldDef.items, fieldName, key, mode);
            return new GraphQLList(itemType);
        case 'enum':
            if (!fieldDef.values || !Array.isArray(fieldDef.values)) {
                throw new Error(
                    `Missing or invalid enum values for ${fieldName}`
                );
            }
            const enumSuffix =
                mode === 'filter'
                    ? '_Filter'
                    : mode === 'sort'
                        ? '_Sort'
                        : mode === 'input'
                            ? '_Input'
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
                    {} as Record<string, { value: string }>
                ),
            });
        default:
            throw new Error(`Unsupported input field type: ${fieldDef.type}`);
    }
}

export function createPagingInputType(name: string): GraphQLInputObjectType {
    return new GraphQLInputObjectType({
        name: `${capitalizeFirstLetter(name)}Paging`,
        fields: {
            limit: { type: GraphQLInt, defaultValue: 20 },
            offset: { type: GraphQLInt, defaultValue: 0 },
        },
    });
}

export function clearInputRegistry() {
    inputTypeRegistry.clear();
    logger.debug?.(`Cleared input type registry`);
}
