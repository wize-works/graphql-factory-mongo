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

---

## 🛠 Usage

```ts
import { createGraphQLSchema } from '@wizeworks/graphql-factory-mongo'
import { connectMongo } from '@wizeworks/graphql-factory-mongo'
import { useLogger, ConsoleLogger } from '@wizeworks/graphql-factory-mongo'
import { useTracer, NoopTracer } from '@wizeworks/graphql-factory-mongo'

useLogger(ConsoleLogger)
useTracer(NoopTracer)

const metadata = {
  fields: {
    title: { type: 'string' },
    body: { type: 'text' },
    tenantId: { type: 'uuid', required: true },
    createdAt: { type: 'datetime' }
  },
  tenantScoped: true,
  subscriptions: {
    onCreated: true
  }
}

const schema = createGraphQLSchema('Article', metadata)
```

---

## 🔌 Context Shape

The GraphQL context must include:
```ts
{
  mongo: MongoClient
  user?: { id: string }
  tenantId?: string
}
```

---

## 🧱 Metadata Format

```ts
{
  fields: {
    name: { type: 'string', required: true },
    createdAt: { type: 'datetime' },
    status: {
      type: 'uuid',
      relation: {
        model: 'Status',
        type: 'one'
      }
    }
  },
  tenantScoped: true,
  subscriptions: {
    onCreated: true,
    onUpdated: true
  }
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
