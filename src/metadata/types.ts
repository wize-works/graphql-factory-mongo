// src/metadata/types.ts

export type FieldType =
    | 'string'
    | 'text'
    | 'number'
    | 'integer'
    | 'int'
    | 'float'
    | 'double'
    | 'decimal'
    | 'date'
    | 'time'
    | 'timestamp'
    | 'boolean'
    | 'datetime'
    | 'uuid'
    | 'id'
    | 'json'
    | 'enum'
    | 'array'
    | 'object';

export interface RelationDefinition {
    model: string;
    localField?: string;
    foreignField?: string;
    type?: 'one' | 'many';
}

export interface FieldDefinition {
    items: any;
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

