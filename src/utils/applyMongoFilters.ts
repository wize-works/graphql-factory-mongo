import { FieldDefinition, Metadata } from '../metadata/types';
import { getLogger } from './logger';

const logger = getLogger();

const KNOWN_OPERATORS = new Set([
    'eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'in', 'contains', 'startsWith', 'endsWith'
]);

function extractFieldAndOp(fieldName: string): [string, string | null] {
    logger.debug?.(`extractFieldAndOp called with fieldName: ${fieldName}`);
    const parts = fieldName.split('_');
    if (parts.length > 1) {
        const op = parts[parts.length - 1];
        if (KNOWN_OPERATORS.has(op)) {
            return [parts.slice(0, -1).join('_'), op];
        }
    }
    return [fieldName, null];
}

export function applyMongoFilters(input: Record<string, any> = {}, metadata: Metadata): Record<string, any> {
    const filter: Record<string, any> = {};

    for (const [fieldKey, value] of Object.entries(input)) {
        const [fieldName, op] = extractFieldAndOp(fieldKey);
        logger.info?.(`Processing field: ${fieldKey} with value: ${value}`);
        logger.debug?.(`Resolved as field: ${fieldName}, op: ${op}`);

        // Check for nested object field paths (e.g., "address.city")
        const fieldPath = fieldName.split('.');
        let fieldDef = metadata.fields[fieldPath[0]];

        // Handle nested fields in objects
        if (fieldPath.length > 1 && fieldDef && fieldDef.type === 'object') {
            // Navigate through nested object structure to find the field definition
            let nestedFieldDef: FieldDefinition | null = fieldDef;
            for (let i = 1; i < fieldPath.length; i++) {
                if (nestedFieldDef && nestedFieldDef.fields && nestedFieldDef.fields[fieldPath[i]]) {
                    nestedFieldDef = nestedFieldDef.fields[fieldPath[i]];
                } else {
                    nestedFieldDef = null;
                    break;
                }
            }
            if (nestedFieldDef) {
                fieldDef = nestedFieldDef;
            }
        }

        if (!fieldDef) continue;

        logger.debug?.('op', { op, fieldKey, fieldName, value, fieldDef });

        if (op) {
            const mongoOps: Record<string, any> = {};
            switch (op) {
                case 'eq': mongoOps['$eq'] = value; break;
                case 'neq': mongoOps['$ne'] = value; break;
                case 'lt': mongoOps['$lt'] = value; break;
                case 'lte': mongoOps['$lte'] = value; break;
                case 'gt': mongoOps['$gt'] = value; break;
                case 'gte': mongoOps['$gte'] = value; break;
                case 'contains':
                    mongoOps['$regex'] = value
                    mongoOps['$options'] = 'i'
                    break;
                case 'startsWith':
                    mongoOps['$regex'] = `^${value}`
                    mongoOps['$options'] = 'i'
                    break;
                case 'endsWith':
                    mongoOps['$regex'] = `${value}$`
                    mongoOps['$options'] = 'i'
                    break;
                default:
                    mongoOps[`$${op}`] = value;
            }
            filter[fieldName] = mongoOps;
        } else if (fieldKey.endsWith('_in')) {
            logger.debug?.('*****************in*********************', { fieldKey, fieldName, value });
            const field = fieldKey.replace('_in', '');
            filter[field] = { $in: Array.isArray(value) ? value : [value] };
        } else {
            filter[fieldName] = value;
        }
    }

    return filter;
}