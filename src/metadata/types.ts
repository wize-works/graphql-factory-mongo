// src/metadata/types.ts

export type FieldType =
    | 'string'
    | 'text'
    | 'number'
    | 'boolean'
    | 'datetime'
    | 'uuid'
    | 'json';

export interface RelationDefinition {
    model: string;
    localField?: string;
    foreignField?: string;
    type?: 'one' | 'many';
}

export interface FieldDefinition {
    type: FieldType;
    required?: boolean;
    defaultValue?: any;
    description?: string;
    relation?: RelationDefinition;
    enum?: string[];
    systemReserved?: boolean;
}

export interface Metadata {
    fields: Record<string, FieldDefinition>;
    indexes?: string[][];
    subscriptions?: {
        onCreated?: boolean;
        onUpdated?: boolean;
        onDeleted?: boolean;
    };
    tenantScoped?: boolean;
}

