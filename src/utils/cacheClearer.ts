// src/utils/cacheClearer.ts
import { clearTypeRegistry } from '../graphql/types'
import { clearInputRegistry } from '../graphql/inputs'

export function clearSchemaCaches() {
    clearTypeRegistry()
    clearInputRegistry()
}
