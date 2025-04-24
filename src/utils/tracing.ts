// src/utils/tracing.ts

export interface ITracer {
    startSpan<T>(name: string, fn: () => T | Promise<T>): T | Promise<T>
}

export const NoopTracer: ITracer = {
    startSpan(name, fn) {
        return fn()
    }
}

let activeTracer: ITracer = NoopTracer

export function useTracer(tracer: ITracer) {
    activeTracer = tracer
}

export function getTracer(): ITracer {
    return activeTracer
}
