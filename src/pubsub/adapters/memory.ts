// src/pubsub/adapters/memory.ts

import { PubSub } from 'graphql-subscriptions';
import { getLogger } from '../../utils/logger';

const logger = getLogger();
logger.info?.('Using in-memory PubSub adapter');

export const memoryPubSub = new PubSub();
