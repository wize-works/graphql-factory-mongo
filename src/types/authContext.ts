// src/types/auth-context.ts

import { MongoClient } from 'mongodb'

export interface AuthContext {
    userId: string
    tenantId: string
    clientApp: string
    scopes: string[]
}
