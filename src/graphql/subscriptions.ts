// src/graphql/subscriptions.ts

import { GraphQLFieldConfigMap } from 'graphql'
import { createGraphQLType } from './types'
import { getMetadata } from '../metadata/registry'
import { pubsub } from '../pubsub'
import { getLogger } from '../utils/logger'
import { requireScope } from '../utils/requireScope'
import { Metadata } from '../metadata/types'

export function generateSubscriptions(name: string, metadata: Metadata): GraphQLFieldConfigMap<any, any> {
    const logger = getLogger()
    const type = createGraphQLType(name, metadata)
    const fields: GraphQLFieldConfigMap<any, any> = {}

    if (metadata.subscriptions?.onCreated) {
        fields[`on${name}Created`] = {
            type,
            subscribe: (_, __, context) => {
                requireScope(context, `${name.toLowerCase()}:subscribe`)
                logger.info(`Subscribed: on${name}Created`)
                return pubsub.asyncIterableIterator(`${name}_CREATED`)
            },
            resolve: (payload: any) => payload
        }
    }

    if (metadata.subscriptions?.onUpdated) {
        fields[`on${name}Updated`] = {
            type,
            subscribe: (_, __, context) => {
                requireScope(context, `${name.toLowerCase()}:subscribe`)
                logger.info(`Subscribed: on${name}Updated`)
                return pubsub.asyncIterableIterator(`${name}_UPDATED`)
            },
            resolve: (payload: any) => payload
        }
    }

    if (metadata.subscriptions?.onDeleted) {
        fields[`on${name}Deleted`] = {
            type,
            subscribe: (_, __, context) => {
                requireScope(context, `${name.toLowerCase()}:subscribe`)
                logger.info(`Subscribed: on${name}Deleted`)
                return pubsub.asyncIterableIterator(`${name}_DELETED`)
            },
            resolve: (payload: any) => payload
        }
    }

    return fields
}
