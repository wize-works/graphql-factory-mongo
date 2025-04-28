// src/graphql/typeRegistry.ts

import { getLogger } from '../utils/logger';

import { GraphQLObjectType, GraphQLInputObjectType } from 'graphql';
import { SchemaKey, toSchemaKeyString } from '../metadata/schemaKey';

const objectTypeRegistry = new Map<string, GraphQLObjectType>();
const inputTypeRegistry = new Map<string, GraphQLInputObjectType>();
const logger = getLogger();

export function registerObjectType(key: SchemaKey, type: GraphQLObjectType) {
    logger.info?.('Registered GraphQLObjectType', key);
    objectTypeRegistry.set(toSchemaKeyString(key), type);
}

export function getObjectType(key: SchemaKey): GraphQLObjectType | undefined {
    return objectTypeRegistry.get(toSchemaKeyString(key));
}

export function registerInputType(key: SchemaKey, inputType: GraphQLInputObjectType) {
    logger.info?.('Registered GraphQLInputObjectType', key);
    inputTypeRegistry.set(toSchemaKeyString(key), inputType);
}

export function getInputType(key: SchemaKey): GraphQLInputObjectType | undefined {
    return inputTypeRegistry.get(toSchemaKeyString(key));
}

export function clearTypeCache(key: SchemaKey) {
    logger.info?.('Clearing GraphQLObjectType from cache', key);
    objectTypeRegistry.delete(toSchemaKeyString(key));
    logger.info?.('Clearing GraphQLInputObjectType from cache', key);
    inputTypeRegistry.delete(toSchemaKeyString(key));
}
