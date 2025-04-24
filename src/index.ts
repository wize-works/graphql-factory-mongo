// src/index.ts

import { getLogger, useLogger, ConsoleLogger } from './utils/logger'
import { getTracer, useTracer, NoopTracer } from './utils/tracing'

// Default to console + no-op unless set
useLogger(ConsoleLogger)
useTracer(NoopTracer)

export * from './factory'
export * from './metadata/types'
export * from './metadata/registry'
export * from './metadata/validators'
export * from './mongo/context'
export * from './mongo/connectMongo'
export * from './mongo/utils'
export * from './graphql/types'
export * from './graphql/queries'
export * from './graphql/mutations'
export * from './graphql/subscriptions'
export * from './graphql/inputs'
export * from './graphql/resolvers'
export * from './pubsub'
export * from './utils/logger'
export * from './utils/tracing'