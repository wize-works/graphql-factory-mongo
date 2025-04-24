// src/metadata/registry.ts

import { Metadata } from './types';
import { SchemaKey, toSchemaKeyString } from './schemaKey';
import { getLogger } from '../utils/logger';

const logger = getLogger();
const metadataRegistry = new Map<string, Metadata>();

export function registerMetadata(key: SchemaKey, metadata: Metadata): void {
    logger.info('Registered schema metadata', key);
    metadataRegistry.set(toSchemaKeyString(key), metadata);
}

export function getMetadata(key: SchemaKey): Metadata | undefined {
    return metadataRegistry.get(toSchemaKeyString(key));
}

export function clearMetadata(key: SchemaKey): void {
    logger.info('Cleared schema metadata', key);
    metadataRegistry.delete(toSchemaKeyString(key));
}
