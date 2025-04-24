// src/pubsub/index.ts

import { memoryPubSub } from './adapters/memory'
import { getLogger } from '../utils/logger'

// Eventually, support runtime selection (e.g., Redis)
const logger = getLogger()
logger.info('PubSub initialized with memory adapter')

export const pubsub = memoryPubSub