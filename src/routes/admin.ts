// src/routes/admin.ts

import { Application, Request, Response } from 'express'
import { MongoClient } from 'mongodb'
import { getLogger } from '../utils/logger'
import { createAuthContext } from '../server/authContext'
import { createServerSchema } from '../server/schema'

const logger = getLogger()

interface AdminRouteOptions {
    reloadSchemas: () => Promise<void>
}

export function registerAdminRoutes(
    app: Application,
    mongo: MongoClient,
    schema: any,
    database: string
) {
    app.post('/admin/schemas/refresh', async (req: any, res: any) => {
        try {
            const apiKey = req.headers['wize-api-key'] as string | undefined
            if (!apiKey) {
                return res.status(401).json({ error: 'Missing wize-api-key header' })
            }

            const authContext = await createAuthContext(mongo, apiKey)
            const { tenantId, clientApp } = authContext

            if (!tenantId || !clientApp) {
                logger.warn?.('Refresh request missing tenant or clientApp')
                return res.status(400).json({ error: 'Missing tenantId or clientApp' })
            }

            schema = await createServerSchema(apiKey, mongo, database);

            logger.info?.(`✅ Successfully refreshed schemas for tenant ${tenantId} / app ${clientApp}`)
            return res.json({ success: true })
        } catch (err: any) {
            logger.error?.('❌ Failed to refresh schemas', err)
            return res.status(500).json({ error: err.message })
        }
    })
}
