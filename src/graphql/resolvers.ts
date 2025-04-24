// src/graphql/resolvers.ts

import { generateQueries } from './queries'
import { generateMutations } from './mutations'
import { generateSubscriptions } from './subscriptions'
import { Metadata } from '../metadata/types'

export function generateResolvers(name: string, metadata: Metadata) {
    return {
        Query: generateQueries(name, metadata),
        Mutation: generateMutations(name, metadata),
        Subscription: generateSubscriptions(name, metadata)
    }
}