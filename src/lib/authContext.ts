// src/lib/authContext.ts

import { MongoClient } from 'mongodb'
import { AuthContext } from '../types/authContext'
import { getLogger } from '../utils/logger'
const logger = getLogger()

export function createFactoryAuthContext(mongo: MongoClient) {
    return async (req: import('fastify').FastifyRequest): Promise<AuthContext> => {
        const apiKey = req.headers['wize-api-key']?.toString().trim()

        if (!apiKey) {
            logger.warn('Missing wize-api-key header')
            throw new Error('Missing wize-api-key header')
        }

        const db = mongo.db('wize-identity')
        const apiKeyRecord = await db.collection('api_keys').findOne({ key: apiKey, isActive: true })

        if (!apiKeyRecord) {
            logger.warn(`Invalid or disabled API key: ${apiKey}`)
            throw new Error('Invalid or disabled API key')
        }

        try {
            await db.collection('api_keys').updateOne(
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
            scopes: apiKeyRecord.scopes || []
        }
    }
}

