// src/utils/logger.ts

export interface ILogger {
    info(message: string, meta?: Record<string, any>): void
    warn(message: string, meta?: Record<string, any>): void
    error(message: string | Error, meta?: Record<string, any>): void
    debug?(message: string, meta?: Record<string, any>): void
}

export const ConsoleLogger: ILogger = {
    info: (msg, meta) => console.log('[INFO]', msg, meta),
    warn: (msg, meta) => console.warn('[WARN]', msg, meta),
    error: (msg, meta) => console.error('[ERROR]', msg, meta),
    debug: (msg, meta) => console.debug('[DEBUG]', msg, meta)
}

let activeLogger: ILogger = ConsoleLogger

export function useLogger(logger: ILogger) {
    activeLogger = logger
}

export function getLogger(): ILogger {
    return activeLogger
}