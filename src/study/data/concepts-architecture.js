export const CONCEPTS_ARCHITECTURE = [
  {
    id: "arch-solid",
    cat: "Patterns",
    n: "SOLID Principles",
    s: "Five principles of OO design from Uncle Bob.",
    depth: "deep",
    level: "L2",
    detail: `## SOLID

### S — Single Responsibility
A class should have one reason to change.
\`\`\`js
// BAD — multiple reasons to change
class User {
  save() { /* DB */ }
  sendEmail() { /* Email */ }
  generateReport() { /* Report */ }
}

// GOOD — separated
class User { /* state */ }
class UserRepository { save(user) {} }
class EmailService { send(user) {} }
class ReportGenerator { generate(user) {} }
\`\`\`

### O — Open/Closed
Open for extension, closed for modification.
\`\`\`js
// BAD — modify for every new shape
function area(shape) {
  if (shape.type === 'circle') return ...;
  if (shape.type === 'square') return ...;
}

// GOOD — polymorphism
class Circle { area() { return pi * r * r; } }
class Square { area() { return s * s; } }
shapes.forEach(s => s.area());  // Add triangle? New class, no changes to existing code.
\`\`\`

### L — Liskov Substitution
Subtypes must be substitutable for base types.
\`\`\`js
// BAD — Square extends Rectangle but breaks expectations
class Rectangle { setWidth(w) {...} setHeight(h) {...} }
class Square extends Rectangle {
  setWidth(w) { super.setWidth(w); super.setHeight(w); }  // violates expectation
}
\`\`\`
Rule of thumb: subclass shouldn't weaken preconditions or strengthen postconditions.

### I — Interface Segregation
Many specific interfaces > one fat interface.
\`\`\`js
// BAD
interface Worker { work(); eat(); sleep(); }
class Robot implements Worker { eat() { throw "I don't eat"; } }

// GOOD
interface Workable { work(); }
interface Feedable { eat(); }
class Robot implements Workable {}
class Human implements Workable, Feedable {}
\`\`\`

### D — Dependency Inversion
Depend on abstractions, not concretions.
\`\`\`js
// BAD — high-level module depends on low-level
class OrderService {
  constructor() { this.db = new MySQLDB(); }  // hardcoded
}

// GOOD — depend on interface
class OrderService {
  constructor(db) { this.db = db; }  // injected
}
new OrderService(new MySQLDB());
new OrderService(new MockDB());  // testable
\`\`\`

## Why SOLID
- **Testability** — mock dependencies easily
- **Flexibility** — swap implementations
- **Readability** — small classes with clear purpose
- **Avoid tight coupling** — changes don't cascade

## Over-engineering Trap
Don't SOLID-ify a 50-line script. Principles help at scale, hurt at MVP.`,
  },
  {
    id: "arch-ddd",
    cat: "Patterns",
    n: "Domain-Driven Design (DDD)",
    s: "Model software around business domain; bounded contexts.",
    depth: "medium",
    level: "L3",
    detail: `## Why DDD
Complex business logic becomes spaghetti unless modeled carefully. DDD aligns code with domain experts' language.

## Core Concepts

### Ubiquitous Language
Same terms used by developers and domain experts.
Don't translate "order" into "OrderEntity" or "OrderDTO" — keep it \`Order\`.

### Bounded Context
Explicit boundary within which a model is valid.
E.g., "Customer" in Sales means something different than in Support.

Different bounded contexts → different models → often different services.

### Entity
Object with identity that persists over time. \`User\` with id=42 is same even if name changes.

### Value Object
No identity, defined by attributes. \`Money(100, "USD")\` — two instances equal if same values. Immutable.

### Aggregate
Cluster of entities + value objects treated as one unit. Has a **root** — the only entry point.
\`\`\`
Order (root)
├─ OrderLine (entity)
├─ ShippingAddress (value object)
└─ PaymentMethod (value object)
\`\`\`
Rule: modify aggregate state only through root.

### Repository
Abstraction over storage for aggregates.
\`\`\`
interface OrderRepository {
  findById(id): Order
  save(order)
}
\`\`\`
Hides DB details.

### Domain Service
Logic that doesn't naturally belong to an entity.
\`\`\`
class TransferService {
  transfer(from: Account, to: Account, amount: Money) { ... }
}
\`\`\`

### Application Service
Orchestrates use cases. Thin layer: load aggregate → call domain method → save.

## Tactical vs Strategic DDD
- **Tactical** — entities, value objects, aggregates, repositories (coding patterns)
- **Strategic** — bounded contexts, context maps, language (system design)

## Context Mapping
How bounded contexts relate:
- **Shared Kernel** — share code
- **Customer-Supplier** — downstream depends on upstream
- **Conformist** — downstream accepts upstream model
- **Anti-Corruption Layer (ACL)** — translate legacy/external models
- **Open Host Service** — published contract for others
- **Published Language** — shared data format (e.g., JSON Schema)

## When to Use DDD
- Complex domain with intricate business rules
- Domain experts available to collaborate
- Long-lived project
- Team > 5

## When NOT
- Simple CRUD app
- Domain is data + simple validation
- Startup with evolving business model (overkill until clarity)

## Related: Hexagonal (Ports & Adapters)
- Core = domain (pure)
- Ports = interfaces the core uses (e.g., OrderRepository)
- Adapters = implementations (PostgresOrderRepository, MockOrderRepository)
Dependencies point inward. Core unaware of DB/HTTP/UI.

![Hexagonal Architecture](https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Hexagonal_Architecture.svg/800px-Hexagonal_Architecture.svg.png)`,
  },
  {
    id: "arch-clean",
    cat: "Patterns",
    n: "Clean Architecture & Hexagonal",
    s: "Domain at center; dependencies point inward.",
    depth: "medium",
    level: "L2",
    detail: `## Clean Architecture (Uncle Bob)

![Clean Architecture](https://blog.cleancoder.com/uncle-bob/images/2012-08-13-the-clean-architecture/CleanArchitecture.jpg)

Layers from inside out:
1. **Entities** — enterprise business rules (pure)
2. **Use Cases** — application business rules
3. **Interface Adapters** — controllers, gateways, presenters
4. **Frameworks & Drivers** — DB, web, UI

### Dependency Rule
Dependencies point INWARD. Inner layers know nothing about outer.

Inversion: outer layer implements interface defined by inner.
\`\`\`
UseCase → (depends on) → IRepository (interface)
                              ↑ implements
PostgresRepo
\`\`\`

## Hexagonal Architecture (Ports & Adapters)
Same spirit, different visualization.

- **Core** (hexagon) — domain logic
- **Ports** — interfaces (primary: driven from outside; secondary: core drives)
- **Adapters** — implementations (REST controller, DB, message queue)

### Example: Order Service
\`\`\`
          ┌─────────────────┐
          │   REST Adapter  │  ← Primary port (driving)
          └────────┬────────┘
                   ↓
          ┌─────────────────┐
          │  OrderUseCase   │  ← Core
          │   + Entities    │
          └────────┬────────┘
                   ↓
          ┌─────────────────┐
          │ Secondary Ports │
          │ - IOrderRepo    │
          │ - IPaymentSvc   │
          └────────┬────────┘
                   ↓ impl
   ┌─────────────┬─────────────┐
   │ PostgresRepo│ StripeAdapter │
   └─────────────┴─────────────┘
\`\`\`

## Benefits
- **Testable** — swap adapters for mocks
- **Tech-independent** — replace Postgres with Mongo, REST with gRPC, no domain change
- **Focus on business** — infrastructure is "outer"

## Onion Architecture
Another variation. Domain at center, domain services, application, outer infrastructure. Same principles.

## Trade-offs
- More boilerplate (interfaces + impls)
- Harder for juniors
- Overkill for simple CRUD
- Good for: complex domain logic, long-lived systems, multi-interface apps`,
  },
  {
    id: "arch-event-driven",
    cat: "Patterns",
    n: "Event-Driven Architecture",
    s: "Services communicate via events; loose coupling.",
    depth: "medium",
    level: "L2",
    detail: `## Event-Driven Architecture (EDA)
Services publish events when something happens. Others subscribe and react.

\`\`\`
OrderCreated → Inventory, Email, Analytics (all react)
\`\`\`

## vs Request-Response
### Request-Response
\`\`\`
OrderService.create() {
  inventory.reserve()  // sync call
  email.send()         // sync call
  analytics.log()      // sync call
}
\`\`\`
- Tight coupling (OrderService knows about all consumers)
- Blocks on slow services
- One failure breaks chain

### Event-Driven
\`\`\`
OrderService.create() {
  publish('order.created', data)
}

// Other services subscribe independently
inventory.on('order.created', reserve)
email.on('order.created', send)
analytics.on('order.created', log)
\`\`\`
- Loose coupling
- Async (non-blocking)
- Scales independently
- New consumers added without changing publisher

## Patterns

### Event Notification
"Something happened" — minimal data; consumers fetch details.
\`\`\`json
{ "type": "order.created", "orderId": "abc" }
\`\`\`

### Event-Carried State Transfer
Full state in event — consumers don't need to call back.
\`\`\`json
{ "type": "order.created", "order": { "id": "abc", "items": [...], "total": 99 } }
\`\`\`

### Event Sourcing
Events are the source of truth; state derived. (Separate concept)

### CQRS
Commands write events; queries read from projections.

## Messaging Infrastructure
- **Kafka** — log, replay, high throughput
- **RabbitMQ** — queues, routing flexibility
- **AWS EventBridge / Google Pub/Sub** — managed

## Challenges

### Eventual Consistency
UI may show stale data briefly. Design UX: "Order processing..." states.

### Ordering
Strict ordering needed? Partition by key (Kafka). Or accept out-of-order with causality tracking.

### Duplicate Delivery
Most brokers: at-least-once. Consumers must be **idempotent**.

### Schema Evolution
Events persist → old consumers may read new events. Use schema registry (Confluent, Pulsar). Additive changes only.

### Debugging
Harder than sync. Distributed tracing essential.

### Poison Messages
Message that consumer can't process (crashes, throws). DLQ (Dead Letter Queue) + alert.

## When to Use
- Many consumers want same data
- Loose coupling > synchronous consistency
- High throughput
- Async workflows (emails, notifications, analytics)
- Event sourcing natural fit

## When NOT
- Need immediate response with data
- Simple CRUD with tight latency requirements
- Small system where complexity cost exceeds benefit`,
  },
  {
    id: "arch-adr",
    cat: "Process",
    n: "Architecture Decision Records (ADRs)",
    s: "Short docs capturing 'why' behind architectural choices.",
    depth: "medium",
    level: "L3",
    detail: `## What is an ADR
A short document (1-2 pages) capturing an architectural decision: context, choice, consequences.

Why it matters:
- Code doesn't explain why
- Teams change — knowledge leaves
- New members ask "why are we doing it this way?"

## ADR Template (common format)

\`\`\`markdown
# ADR-001: Use PostgreSQL as primary datastore

## Status
Accepted (2024-03-15)

## Context
We need a primary datastore for our order service.
Requirements:
- ACID transactions (financial data)
- Scale to ~10M orders/year
- Good tooling for team (experience with SQL)
- Strong ecosystem in our language (Node/TS)

Options considered:
1. PostgreSQL
2. MySQL
3. MongoDB
4. DynamoDB

## Decision
We chose **PostgreSQL**.

## Rationale
- ACID fits financial domain
- JSONB supports flexible payloads
- Team has Postgres experience
- Easy local dev (docker)
- Strong ORM support (Prisma)
- Managed offerings (RDS, Aurora) mature

## Consequences

### Positive
- Strong consistency by default
- Rich query capabilities (CTEs, window fns)
- Great tooling (pgAdmin, DataGrip)

### Negative
- Vertical scaling limits
- Must manage sharding ourselves at 100M+ rows
- JSON-heavy queries slower than MongoDB

### Neutral
- Backup strategy needed
- Schema migrations require care in deploys
\`\`\`

## Best Practices

### Status
- Proposed — under discussion
- Accepted — agreed upon
- Deprecated — still in code but not for new work
- Superseded by ADR-042 — replaced by later decision

### Immutable
Don't edit ADRs after acceptance — write a new one superseding it. This preserves history.

### Numbered
ADR-001, ADR-002, etc. Check into the repo alongside code (usually \`docs/adr/\`).

### Short
If it's longer than 2 pages, split.

### Write at Decision Time
Not retroactively. Preserves the actual reasoning (future you will think "that was obvious" — it wasn't).

## Tools
- Markdown + Git (simplest)
- [adr-tools](https://github.com/npryce/adr-tools) — CLI helpers
- Structurizr, Docusaurus for rendering

## Interview Use
"Tell me about a significant architectural decision" — ADR format structures a great answer:
- Context (constraints, requirements)
- Options considered
- Decision
- Trade-offs accepted

## Sample Decisions Worth ADR'ing
- Choice of primary datastore
- Sync vs async communication
- Monolith vs microservices
- State management library
- Build tool
- Cloud provider
- Authentication approach
- SSR vs SPA vs hybrid`,
  },
];
