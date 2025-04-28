
import { Metadata } from '../metadata/types';
import { getLogger } from './logger';

const logger = getLogger();

const KNOWN_OPERATORS = new Set([
    'eq', 'neq', 'lt', 'lte', 'gt', 'gte', 'contains', 'startsWith', 'endsWith'
]);

function extractFieldAndOp(fieldName: string): [string, string | null] {
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

        const fieldDef = metadata.fields[fieldName];
        if (!fieldDef) continue;

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
        } else {
            filter[fieldName] = value;
        }
    }

    return filter;
}