// src/mongo/utils.ts

import { getLogger } from '../utils/logger'
import { getTracer } from '../utils/tracing'

export function toMongoFilter(filter: Record<string, any>) {
    const logger = getLogger()
    const tracer = getTracer()

    return tracer.startSpan('utils.toMongoFilter', async () => {
        logger.debug?.('Building MongoDB filter', { filter })
        // TODO: Add support for more advanced filters ($gt, $in, etc.)
        return filter
    })
}