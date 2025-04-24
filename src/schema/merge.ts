// src/utils/buildMergedSchema.ts

import { GraphQLFieldConfig, GraphQLFieldConfigMap, GraphQLObjectType, GraphQLSchema } from 'graphql';
import { createResolvers } from '../graphql/resolvers';
import { validateMetadata } from '../metadata/validators';
import { Metadata } from '../metadata/types';
import { SchemaKey } from '../metadata/schemaKey';
import { normalizeArgs } from '../utils/normalizeArgs';

export function buildMergedSchema(
    schemas: Array<{ name: string; metadata: Metadata; tenantId: string; clientApp: string }>
): GraphQLSchema {
    const allQuerys = [];
    const allMutations = [];
    const allSubscriptions = [];

    for (const s of schemas) {
        validateMetadata(s.name, s.metadata);

        const key: SchemaKey = {
            name: s.name,
            tenantId: s.tenantId,
            clientApp: s.clientApp
        };

        const resolvers = createResolvers(key, s.metadata);
        
        allQuerys.push(resolvers.query);
        allMutations.push(resolvers.mutation);
        allSubscriptions.push(resolvers.subscription);
    }

    function mergeFields(types: GraphQLObjectType[]): () => GraphQLFieldConfigMap<any, any> {
        return () => {
            const merged: GraphQLFieldConfigMap<any, any> = {};
            for (const type of types) {
                const fields = type.getFields();
                for (const [fieldName, fieldConfig] of Object.entries(fields)) {
                    const fixedField: GraphQLFieldConfig<any, any> = {
                        ...fieldConfig,
                        args: normalizeArgs(fieldConfig.args)
                    };
                    merged[fieldName] = fixedField;
                }
            }
            return merged;
        };
    }
    return new GraphQLSchema({
        query: new GraphQLObjectType({ name: 'Query', fields: mergeFields(allQuerys) }),
        mutation: new GraphQLObjectType({ name: 'Mutation', fields: mergeFields(allMutations) }),
        subscription: new GraphQLObjectType({ name: 'Subscription', fields: mergeFields(allSubscriptions) })
    });
}
