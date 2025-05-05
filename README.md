# @wizeworks/graphql-factory-mongo

Dynamic GraphQL API generation from metadata definitions — built for MongoDB.

> Create fully-typed GraphQL schemas, resolvers, and subscriptions dynamically based on JSON metadata, with support for multi-tenant models, relations, tracing, and logging.

---

## ✨ Features

- 🧠 **Metadata-Driven**: Define your schema in JSON and generate everything — types, inputs, filters, and resolvers
- 🔗 **Relation Support**: One-to-one and one-to-many references with dynamic field resolution
- 🏢 **Multi-Tenant Ready**: Shared collection support with tenant filtering logic
- 🔍 **Built-in Observability**: Plug in your logger and tracer (supports Sentry, OpenTelemetry, and more)
- 📡 **GraphQL Subscriptions**: Supports `onCreated`, `onUpdated`, and `onDeleted` PubSub events
- 🚀 **Pluggable Backend**: MongoDB as the backend; Redis or in-memory PubSub for events

---

## 📦 Installation

```bash
npm install @wizeworks/graphql-factory-mongo
```
## 🌍 Environment Variables

The following environment variables are required to configure the application:

| Variable       | Description                                      | Default Value                     |
|----------------|--------------------------------------------------|-----------------------------------|
| `PORT`         | The port on which the server will run            | `3000`                            |
| `MONGO_URI`    | The connection string for the MongoDB instance   | `mongodb://localhost:27017/app`   |
| `SENTRY_DSN`   | The Sentry URI for sending logs and errors to.   | `###.ingest.us.sentry.io/###`     |
| `DB_NAME`      | The API key used for authentication              | `wize-example`                    |

Make sure to set these variables in your `.env` file or your deployment environment.

### Example `.env` File

```env
PORT=3000
MONGO_URI=mongodb://localhost:27017/wize-example
DB_NAME=wize-example
SENTRY_DSN=https://
```

---

## 🛠 Usage



```ts

import express from 'express';
import { MongoClient } from 'mongodb';
import { createYoga } from 'graphql-yoga';
import { createServerSchema, createServerContext, registerSchemaRoutes, ILogger } from '@wizeworks/graphql-factory-mongo';

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/';
const database = process.env.DB_NAME || 'wize-example';
const mongoClient = new MongoClient(MONGO_URI);

const logger: ILogger = {
    error: (message: string) => {
        const date = new Date();
        const formattedDate = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
        console.error(`[${formattedDate}] ERROR: ${message}`);
    },
    warn: (message: string) => {
        const date = new Date();
        const formattedDate = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
        console.warn(`[${formattedDate}] WARNING: ${message}`);
    },
    info: (message: string) => {
        const date = new Date();
        const formattedDate = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
        console.info(`[${formattedDate}] INFO: ${message}`);
    },
    debug: (message: string) => {
        const date = new Date();
        const formattedDate = date.toISOString().replace(/T/, ' ').replace(/\..+/, '');
        console.debug(`[${formattedDate}] DEBUG: ${message}`);
    },
};


const start = async () => {
    await mongoClient.connect();

    const yoga = createYoga({
        graphqlEndpoint: '/graphql',
        schema: (args) => createServerSchema(args.request, mongoClient,database),
        context: async ({request}) => {
            const baseContext = await createServerContext(request, mongoClient);
            return {
                ...baseContext,
                database,
            };
        },
        graphiql: true
    });

    const app = express();
    app.use(express.json());
    
    const schema = registerSchemaRoutes(app, mongoClient, database);

    // Use Yoga as middleware in Express
    app.use(yoga.graphqlEndpoint, yoga);

    app.listen(port, () => {
        console.log(`🚀 wize-example API ready at http://localhost:${port}/graphql`);
    });
};

start();
```

---

## 🧱 Metadata Format

```ts
{
    table: "example",
    metadata: {
    fields: [
        {
            _id: "string",
            name: {
                type: "string",
                required: true,
            }
        }
    ],
    subscriptions: {
        onCreated: true,
        onUpdated: true,
        onDeleted: true
    }
    },
    clientApp: "example-client-app"
}
```

---

## 🔧 Setting Up Logging and Tracing

By default, the package uses a console logger and a no-op tracer. To connect a real logger (e.g. Sentry, Pino) or tracer (e.g. OpenTelemetry), use:

```ts
import { useLogger, useTracer } from '@wizeworks/graphql-factory-mongo'
import { SentryLogger, SentryTracer } from './my-sentry-setup'

useLogger(SentryLogger)
useTracer(SentryTracer)
```

You can plug in any provider by implementing the following interfaces:

```ts
interface ILogger {
  info(msg: string, meta?: object): void
  warn(msg: string, meta?: object): void
  error(msg: string | Error, meta?: object): void
  debug?(msg: string, meta?: object): void
}

interface ITracer {
  startSpan<T>(name: string, fn: () => Promise<T>): Promise<T>
}
```

---

## 🔭 Observability

Supports pluggable:

- `ILogger`: Console, Sentry, Logtail, etc.
- `ITracer`: Noop, Sentry.startSpan, OpenTelemetry

---

## 📬 PubSub Adapters

| Adapter    | Module                        | Notes                |
|------------|-------------------------------|----------------------|
| In-memory  | `graphql-subscriptions`       | Default              |
| Redis      | `graphql-redis-subscriptions` | Opt-in, via adapter  |

---

## 🧪 Dev Scripts

```bash
npm run build
npm run dev
npm run clean
npm run semantic-release
```

---

## 📄 License

MIT © [WizeWorks](https://github.com/wize-works)

---

### Filtering with Enums

You can now use the `_in` operator to filter enum fields by providing a list of possible values. For example:

```graphql
query {
  findProjects(filter: { status_in: ["PLANNING", "IN_PROGRESS"] }) {
    count
    data {
      _id
      name
      status
    }
  }
}
```

This query will return all projects where the `status` is either `PLANNING` or `IN_PROGRESS`.
