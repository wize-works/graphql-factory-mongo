// src/metadata/validators.ts

import { Metadata, FieldType } from './types';
import { getLogger } from '../utils/logger';

const allowedTypes: FieldType[] = [
    'string', 'text', 'json', 'number', 'integer', 'int', 'float', 'double', 'decimal',
    'datetime', 'date', 'time', 'timestamp', 'boolean', 'uuid', 'enum', 'array', 'id', 'object',
];

export function validateMetadata(name: string, metadata: Metadata): void {
    const logger = getLogger();

    for (const [field, def] of Object.entries(metadata.fields)) {
        if (!allowedTypes.includes(def.type)) {
            logger.error?.(`Invalid type '${def.type}' for field '${field}' in schema '${name}'`);
            throw new Error(`Invalid type '${def.type}' for field '${field}' in schema '${name}'`);
        }

        // Additional validation for array types
        if (def.type === 'array') {
            if (!def.items || !def.items.type) {
                logger.error?.(`Array field '${field}' in schema '${name}' must define items with a type`);
                throw new Error(`Array field '${field}' in schema '${name}' must define items with a type`);
            }

            if (!allowedTypes.includes(def.items.type) && def.items.type !== 'object') {
                logger.error?.(`Invalid item type '${def.items.type}' for array field '${field}' in schema '${name}'`);
                throw new Error(`Invalid item type '${def.items.type}' for array field '${field}' in schema '${name}'`);
            }
        }

        // Additional validation for object types
        if (def.type === 'object') {
            if (!def.fields || typeof def.fields !== 'object') {
                logger.error?.(`Object field '${field}' in schema '${name}' must define subfields`);
                throw new Error(`Object field '${field}' in schema '${name}' must define subfields`);
            }
        }
    }

    logger.info?.(`Metadata validation passed for schema '${name}'`)
}
