// src/graphql/subscriptions.ts

import { GraphQLFieldConfigMap } from 'graphql'
import { createGraphQLType } from './types'
import { getMetadata } from '../metadata/registry'
import { pubsub } from '../pubsub'
import { getLogger } from '../utils/logger'

export function generateSubscriptions(name: string, metadata): GraphQLFieldConfigMap<any, any> {
    const logger = getLogger()
    const type = createGraphQLType(name, metadata)
    const fields: GraphQLFieldConfigMap<any, any> = {}

    if (metadata.subscriptions?.onCreated) {
        fields[`on${name}Created`] = {
            type,
            subscribe: () => {
                logger.info(`Subscribed: on${name}Created`)
                return pubsub.asyncIterator(`${name}_CREATED`)
            },
            resolve: (payload: any) => payload
        }
    }

    if (metadata.subscriptions?.onUpdated) {
        fields[`on${name}Updated`] = {
            type,
            subscribe: () => {
                logger.info(`Subscribed: on${name}Updated`)
                return pubsub.asyncIterator(`${name}_UPDATED`)
            },
            resolve: (payload: any) => payload
        }
    }

    if (metadata.subscriptions?.onDeleted) {
        fields[`on${name}Deleted`] = {
            type,
            subscribe: () => {
                logger.info(`Subscribed: on${name}Deleted`)
                return pubsub.asyncIterator(`${name}_DELETED`)
            },
            resolve: (payload: any) => payload
        }
    }

    return fields
}
