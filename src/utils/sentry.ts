// src/utils/sentry.ts
import * as Sentry from '@sentry/node'

export function initSentry(dsn?: string) {
    if (!dsn) return
    Sentry.init({
        dsn,
        tracesSampleRate: 1.0,
        environment: process.env.NODE_ENV || 'development'
    });
}
