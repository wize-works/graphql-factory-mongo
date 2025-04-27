// src/metadata/schemaKey.ts

export interface SchemaKey {
    tenantId: string
    clientApp: string
    database: string
    table: string
}

export function toSchemaKeyString({ table, tenantId, clientApp }: SchemaKey): string {
    return JSON.stringify({ table, tenantId, clientApp });
}
