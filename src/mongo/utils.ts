// src/mongo/utils.ts

import { getLogger } from '../utils/logger'
import { getTracer } from '../utils/tracing'

export function toMongoFilter(filter: Record<string, any>) {
    const logger = getLogger()
    const tracer = getTracer()

    return tracer.startSpan('utils.toMongoFilter', async () => {
        logger.debug?.('Building MongoDB filter', { filter })
        // TODO: Add support for more advanced filters ($gt, $in, etc.)
        for (const key in filter) {
            if (typeof filter[key] === 'object' && filter[key] !== null) {
            for (const operator in filter[key]) {
                if (['$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$ne'].includes(operator)) {
                filter[key] = { ...filter[key] }
                } else {
                throw new Error(`Unsupported operator: ${operator}`)
                }
            }
            }
        }
        return filter
    })
}