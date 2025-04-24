// src/utils/wrapSpan.ts

import { getTracer } from './tracing'

export async function wrapSpan<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
    const tracer = getTracer()
    const result = await tracer.startSpan(name, fn)
    return result
}
