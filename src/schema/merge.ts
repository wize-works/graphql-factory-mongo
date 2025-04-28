// src/utils/buildMergedSchema.ts

import { GraphQLFieldConfig, GraphQLFieldConfigMap, GraphQLObjectType, GraphQLSchema } from 'graphql';
import { createResolvers } from '../graphql/resolvers';
import { validateMetadata } from '../metadata/validators';
import { Metadata } from '../metadata/types';
import { SchemaKey } from '../metadata/schemaKey';
import { normalizeArgs } from '../utils/normalizeArgs';
import { getLogger } from '../utils/logger';

const logger = getLogger();

export function buildMergedSchema(
    schemas: Array<{ table: string; database: string; metadata: Metadata; tenantId: string; clientApp: string }>
): GraphQLSchema {
    const allQuerys = [];
    const allMutations = [];
    const allSubscriptions = [];
    try {

        for (const s of schemas) {
            validateMetadata(s.table, s.metadata);

            const key: SchemaKey = {
                table: s.table,
                database: s.database,
                tenantId: s.tenantId,
                clientApp: s.clientApp
            };

            const resolvers = createResolvers(key, s.metadata);

            allQuerys.push(resolvers.query);
            allMutations.push(resolvers.mutation);
            allSubscriptions.push(resolvers.subscription);
        }

        function mergeFields(types: GraphQLObjectType[]): () => GraphQLFieldConfigMap<any, any> {
            logger.debug?.('Merging fields from types', types.map(type => type.name));
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
    catch (error) {
        logger.error?.('Error building merged schema', { error });
        if (error instanceof Error) {
            throw new Error(`Failed to build merged schema: ${error.message}`);
        } else {
            throw new Error('Failed to build merged schema: Unknown error');
        }
    }
}
