// src/graphql/inputs.ts

import { getLogger } from '../utils/logger';
import { getTracer } from '../utils/tracing';

import { GraphQLInputObjectType, GraphQLString, GraphQLID } from 'graphql';
import { Metadata } from '../metadata/types';
import { SchemaKey, toSchemaKeyString } from '../metadata/schemaKey';

const inputTypeRegistry = new Map<string, GraphQLInputObjectType>();

export function createGraphQLInputType(name: string, metadata: Metadata, key: SchemaKey): GraphQLInputObjectType {
    const logger = getLogger();
    const tracer = getTracer();
    const cacheKey = toSchemaKeyString(key);
    if (inputTypeRegistry.has(cacheKey)) {
        logger.info(`Created GraphQLInputType for`, key);
        return inputTypeRegistry.get(cacheKey)!;
    }

    const fields = Object.entries(metadata.fields).reduce((acc, [fieldName, fieldDef]) => {
        acc[fieldName] = { type: resolveInputType(fieldDef.type) };
        return acc;
    }, {} as Record<string, any>);

    const inputType = new GraphQLInputObjectType({
        name,
        fields
    });

    inputTypeRegistry.set(cacheKey, inputType);
    return inputType;
}

function resolveInputType(type: string) {
    switch (type) {
        case 'uuid':
        case 'id':
            return GraphQLID;
        case 'string':
        case 'text':
            return GraphQLString;
        default:
            throw new Error(`Unsupported input field type: ${type}`);
    }
}
