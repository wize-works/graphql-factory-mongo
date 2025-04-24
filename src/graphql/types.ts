// src/graphql/types.ts

import { getLogger } from '../utils/logger';

import { GraphQLObjectType, GraphQLString, GraphQLID } from 'graphql';
import { Metadata } from '../metadata/types';
import { SchemaKey, toSchemaKeyString } from '../metadata/schemaKey';
import { getMetadata } from '../metadata/registry';

const typeRegistry = new Map<string, GraphQLObjectType>();
const logger = getLogger();

export function createGraphQLType(key: SchemaKey, metadata: Metadata): GraphQLObjectType {
    const cacheKey = toSchemaKeyString(key);
    if (typeRegistry.has(cacheKey)) {
        return typeRegistry.get(cacheKey)!;
    }

    const fields = Object.entries(metadata.fields).reduce((acc, [fieldName, fieldDef]) => {
        acc[fieldName] = { type: resolveGraphQLType(fieldDef.type) }
        return acc
    }, {} as Record<string, any>);

    const type = new GraphQLObjectType({
        name: `${key.name}`,
        fields
    });

    logger.info(`Created GraphQLObjectType for`, key);
    typeRegistry.set(cacheKey, type);
    return type;
}

function resolveGraphQLType(type: string) {
    switch (type) {
        case 'uuid':
        case 'id':
            return GraphQLID;
        case 'string':
        case 'text':
            return GraphQLString;
        default:
            throw new Error(`Unsupported field type: ${type}`);
    }
}
