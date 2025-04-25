// src/lib/authContext.ts

import { MongoClient } from 'mongodb'
import { getLogger } from '../utils/logger'
const logger = getLogger()

export async function createAuthContext(mongo: MongoClient, apiKey: string) {
    if (!apiKey) {
        logger.warn('Missing wize-api-key header (graphql-factory)')
        throw new Error('Missing wize-api-key header (graphql-factory)')
    }
    
    const db = mongo.db('wize-identity')
    const apiKeyRecord = await db.collection('tenants').findOne({ key: apiKey, isActive: true })

    if (!apiKeyRecord) {
        logger.warn(`Invalid or disabled API key: ${apiKey}`)
        throw new Error('Invalid or disabled API key')
    }

    try {
        await db.collection('tenants').updateOne(
            { key: apiKey },
            { $set: { last_used_at: new Date() } }
        )
    } catch (updateError: any) {
        logger.warn('⚠️ Failed to update last_used_at:')
        logger.error(updateError)
    }

    return {
        userId: '00000000-0000-0000-0000-000000000000',
        tenantId: apiKeyRecord.tenantId,
        clientApp: apiKeyRecord.clientApp,
        scopes: apiKeyRecord.scopes || [],
        mongo: mongo
    }
}

