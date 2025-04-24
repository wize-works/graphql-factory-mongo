// src/metadata/schemaKey.ts

export interface SchemaKey {
    name: string
    tenantId: string
    clientApp: string
}

export function toSchemaKeyString({ name, tenantId, clientApp }: SchemaKey): string {
    return JSON.stringify({ name, tenantId, clientApp });
}
