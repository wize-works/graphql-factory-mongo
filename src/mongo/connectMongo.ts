// src/mongo/connectMongo.ts

import { MongoClient } from 'mongodb'
import { getLogger } from '../utils/logger'

let client: MongoClient | null = null

export async function connectMongo(uri: string): Promise<MongoClient> {
    const logger = getLogger()

    if (!client) {
        client = new MongoClient(uri)
        await client.connect()
        logger.info('[MongoDB] Connected', { uri })
    }

    return client
}

export function getMongoClient(): MongoClient {
    if (!client) throw new Error('MongoDB client not initialized')
    return client
}