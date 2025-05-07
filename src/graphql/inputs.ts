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

// Generic model type for inputs that can be used across all entities
export function createGenericModelType(metadata: Metadata, key: SchemaKey): GraphQLInputObjectType {
    // Use entity-specific key for model since fields vary by entity
    const cacheKey = `${toSchemaKeyString(key)}:model`;
    if (inputTypeRegistry.has(cacheKey)) {
        return inputTypeRegistry.get(cacheKey)!;
    }

    const fields = Object.entries(metadata.fields).reduce(
        (acc, [fieldName, fieldDef]) => {
            if (fieldDef.systemReserved) {
                return acc; // Skip system reserved fields
            }

            acc[fieldName] = {
                type: resolveInputType(fieldDef, fieldName, key, 'input'),
            };

            return acc;
        },
        {} as Record<string, any>
    );

    const modelType = new GraphQLInputObjectType({
        name: 'Model',
        fields,
    });

    logger.debug?.('Created generic Model input type for', { table: key.table });
    inputTypeRegistry.set(cacheKey, modelType);
    return modelType;
}

// Generic filter type that can be used across all entities
export function createGenericFilterType(metadata: Metadata, key: SchemaKey): GraphQLInputObjectType {
    const cacheKey = `generic:filter`;
    if (inputTypeRegistry.has(cacheKey)) {
        return inputTypeRegistry.get(cacheKey)!;
    }

    const fields = Object.entries(metadata.fields).reduce(
        (acc, [fieldName, fieldDef]) => {
            if (fieldDef.systemReserved) {
                return acc;
            }

            const baseType = resolveInputType(fieldDef, fieldName, key, 'filter');
            acc[fieldName + '_eq'] = { type: baseType };
            acc[fieldName + '_neq'] = { type: baseType };

            if (['string', 'text'].includes(fieldDef.type)) {
                acc[fieldName + '_contains'] = { type: baseType };
                acc[fieldName + '_startsWith'] = { type: baseType };
                acc[fieldName + '_endsWith'] = { type: baseType };
            }

            if (['int', 'float', 'datetime', 'date'].includes(fieldDef.type)) {
                acc[fieldName + '_lt'] = { type: baseType };
                acc[fieldName + '_lte'] = { type: baseType };
                acc[fieldName + '_gt'] = { type: baseType };
                acc[fieldName + '_gte'] = { type: baseType };
            }

            if (fieldDef.type === 'enum') {
                acc[fieldName + '_in'] = { type: new GraphQLList(baseType) };
            }

            return acc;
        },
        {} as Record<string, any>
    );

    const filterType = new GraphQLInputObjectType({
        name: 'Filter',
        fields,
    });

    logger.debug?.('Created generic Filter input type');
    inputTypeRegistry.set(cacheKey, filterType);
    return filterType;
}

// Generic sort type that can be used across all entities
export function createGenericSortType(metadata: Metadata): GraphQLInputObjectType {
    const cacheKey = `generic:sort`;
    if (inputTypeRegistry.has(cacheKey)) {
        return inputTypeRegistry.get(cacheKey)!;
    }

    const fields = Object.entries(metadata.fields).reduce(
        (acc, [fieldName, fieldDef]) => {
            if (fieldDef.systemReserved) {
                return acc;
            }

            acc[fieldName] = {
                type: new GraphQLEnumType({
                    name: `${fieldName}_SortOrder`,
                    values: {
                        ASC: { value: 'asc' },
                        DESC: { value: 'desc' },
                    },
                }),
            };

            return acc;
        },
        {} as Record<string, any>
    );

    const sortType = new GraphQLInputObjectType({
        name: 'Sort',
        fields,
    });

    logger.debug?.('Created generic Sort input type');
    inputTypeRegistry.set(cacheKey, sortType);
    return sortType;
}

// Generic paging type that can be used across all entities
export function createGenericPagingType(): GraphQLInputObjectType {
    const cacheKey = `generic:paging`;
    if (inputTypeRegistry.has(cacheKey)) {
        return inputTypeRegistry.get(cacheKey)!;
    }

    const pagingType = new GraphQLInputObjectType({
        name: 'Paging',
        fields: {
            limit: { type: GraphQLInt, defaultValue: 20 },
            offset: { type: GraphQLInt, defaultValue: 0 },
        },
    });

    logger.debug?.('Created generic Paging input type');
    inputTypeRegistry.set(cacheKey, pagingType);
    return pagingType;
}

// Original function kept for backwards compatibility
export function createGraphQLInputType(
    name: string,
    metadata: Metadata,
    key: SchemaKey,
    mode: 'input' | 'filter' | 'sort' = 'input'
): GraphQLInputObjectType {
    // For filter and sort types, use the generic versions instead
    if (mode === 'filter') {
        return createGenericFilterType(metadata, key);
    } else if (mode === 'sort') {
        return createGenericSortType(metadata);
    } else if (mode === 'input') {
        return createGenericModelType(metadata, key);
    }

    // Should never reach here, but keeping for backward compatibility
    const cacheKey = `${toSchemaKeyString(key)}:${mode}`;
    if (inputTypeRegistry.has(cacheKey)) {
        return inputTypeRegistry.get(cacheKey)!;
    }

    // Capitalize the first letter of 'name' to ensure consistent capitalization
    const capitalizedName = capitalizeFirstLetter(name);

    const fields = Object.entries(metadata.fields).reduce(
        (acc, [fieldName, fieldDef]) => {
            if (fieldDef.systemReserved) {
                return acc; // Skip system reserved fields
            }

            acc[fieldName] = {
                type: resolveInputType(fieldDef, fieldName, key, mode),
            };

            return acc;
        },
        {} as Record<string, any>
    );

    // Check if name already ends with the mode to avoid duplication
    const typeName = capitalizedName.endsWith(capitalizeFirstLetter(mode))
        ? capitalizedName
        : `${capitalizedName}${capitalizeFirstLetter(mode)}`;

    const inputType = new GraphQLInputObjectType({
        name: typeName,
        fields,
    });

    logger.debug?.(`Created GraphQLInputObjectType ${typeName}`, { key, mode });
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
        case 'object':
            // Handle object type by creating a nested input type
            if (!fieldDef.fields) {
                throw new Error(`Missing fields for object field ${fieldName}`);
            }

            const objectTypeName = `${key.table}_${fieldName}_Object${mode === 'filter' ? '_Filter' : mode === 'sort' ? '_Sort' : '_Input'}`;
            const objFields = Object.entries(fieldDef.fields).reduce(
                (acc: Record<string, any>, [subFieldName, subFieldDef]: [string, any]) => {
                    acc[subFieldName] = {
                        type: resolveInputType(subFieldDef, `${fieldName}_${subFieldName}`, key, mode),
                    };
                    return acc;
                },
                {}
            );

            return new GraphQLInputObjectType({
                name: objectTypeName,
                fields: objFields,
            });
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

// Replace createPagingInputType with the generic version
export function createPagingInputType(name: string): GraphQLInputObjectType {
    return createGenericPagingType();
}

export function clearInputRegistry() {
    inputTypeRegistry.clear();
    logger.debug?.(`Cleared input type registry`);
}
