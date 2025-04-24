// src/lib/authContext.ts

import { FastifyRequest } from 'fastify';
import { MongoClient } from 'mongodb';
import { AuthContext } from '../types/authContext';
import { getLogger } from '../utils/logger';
import jwt from 'jsonwebtoken';

export async function authContext(req: FastifyRequest, mongo: MongoClient): Promise<AuthContext> {
    const logger = getLogger();
    const apiKey = (req.headers['wize-api-key'] as string)?.trim();

    if (!apiKey) {
        logger.warn('Missing wize-api-key header');
        throw new Error('Missing wize-api-key header');
    }

    const db = mongo.db('wize-identity');
    const result = await db.collection('api_keys').findOne({ key: apiKey, isActive: true });

    if (!result) {
        logger.warn(`Invalid or disabled API key: ${apiKey}`);
        throw new Error('Invalid or disabled API key');
    }

    try {
        await db.collection('api_keys').updateOne(
            { key: apiKey },
            { $set: { lastUsedAt: new Date() } }
        );
    } catch (err: any) {
        logger.warn('⚠️ Failed to update lastUsedAt');
        logger.error(err as Error);
    }


    const rawToken = (req.headers['authorization'] as string)?.split('Bearer ')[1]?.trim();
    let userId = '00000000-0000-0000-0000-000000000000';

    if (rawToken) {
        try {
            const decoded: any = jwt.decode(rawToken);
            userId = decoded?.sub || userId;
        } catch (err) {
            logger.warn('Failed to decode JWT token');
            logger.error(err as Error);
        }
    }

    return {
        mongo,
        user: { id: userId },
        tenantId: result.tenantId,
        scopes: result.scopes || [],
        clientApp: result.clientApp,
    };
}

export function createFactoryAuthContext(mongo: MongoClient) {
    return async function context(req: FastifyRequest): Promise<AuthContext> {
        return await authContext(req, mongo);
    }
}
