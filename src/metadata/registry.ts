// src/metadata/registry.ts

import { Metadata } from './types'
import { getLogger } from '../utils/logger'

const schemaRegistry: Record<string, Metadata> = {}

export function registerMetadata(name: string, metadata: Metadata): void {
    const logger = getLogger()
    logger.info(`Registering metadata for schema: ${name}`)
    schemaRegistry[name] = metadata
}

export function getMetadata(name: string): Metadata {
    const schema = schemaRegistry[name]
    if (!schema) {
        const logger = getLogger()
        logger.error(`No metadata registered for schema '${name}'`)
        throw new Error(`No metadata registered for schema '${name}'`)
    }
    return schema
}
