// src/metadata/validators.ts

import { Metadata, FieldType } from './types';
import { getLogger } from '../utils/logger';

const allowedTypes: FieldType[] = [
    'string', 'text', 'number', 'boolean', 'datetime', 'uuid', 'json'
];

export function validateMetadata(name: string, metadata: Metadata): void {
    const logger = getLogger();

    for (const [field, def] of Object.entries(metadata.fields)) {
        if (!allowedTypes.includes(def.type)) {
            logger.error(`Invalid type '${def.type}' for field '${field}' in schema '${name}'`);
            throw new Error(`Invalid type '${def.type}' for field '${field}' in schema '${name}'`);
        }
    }

    logger.info(`Metadata validation passed for schema '${name}'`);
}
