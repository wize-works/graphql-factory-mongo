// src/types/auth-context.ts

import { MongoClient } from 'mongodb'

export interface AuthContext {
    mongo: MongoClient
    user: {
        id: string
        name?: string
        [key: string]: any
    }
    tenantId: string
    scopes: string[]
}
