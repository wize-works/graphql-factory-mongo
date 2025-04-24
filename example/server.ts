// in example/server.ts
import { createGraphQLSchema } from '../src/factory'
import jobsightMetadata from './schemas/jobsight.json'

const schema = createGraphQLSchema('jobsight', jobsightMetadata)
