import { Metadata } from './types'

export function enforceSystemFields(metadata: Metadata): Metadata {
    const protectedFields = ['tenantId']

    for (const fieldName of protectedFields) {
        if (metadata.fields[fieldName]) {
            metadata.fields[fieldName].systemReserved = true
        }
    }

    return metadata
}
