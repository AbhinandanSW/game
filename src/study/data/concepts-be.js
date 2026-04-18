// Comprehensive Backend concepts — Databases, Caching, Messaging, APIs, Security, OS, Networking, Distributed Systems

export const CONCEPTS_BE = [
  // ─── Databases ──────────────────────────────────────────
  {
    id: "be-sql-deep",
    cat: "Databases",
    n: "SQL Deep Dive (Joins, Window Fns, CTEs, Indexes)",
    s: "Advanced SQL patterns that interview loves.",
    depth: "deep",
    level: "L2",
    detail: `## Joins Recap
- **INNER** — rows matching in both tables
- **LEFT** — all from left, matching from right (NULL if no match)
- **RIGHT** — inverse of LEFT
- **FULL OUTER** — all from both (NULL where no match)
- **CROSS** — cartesian product

\`\`\`sql
SELECT u.name, o.total
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
WHERE o.created_at > '2024-01-01';
\`\`\`

## Window Functions (powerful!)
Compute over a "window" of rows without grouping.
\`\`\`sql
-- Running total
SELECT date, amount,
  SUM(amount) OVER (ORDER BY date) AS running_total
FROM transactions;

-- Rank top 3 per category
SELECT product, category, revenue,
  RANK() OVER (PARTITION BY category ORDER BY revenue DESC) AS rnk
FROM sales
WHERE rnk <= 3;

-- Moving average
SELECT date, price,
  AVG(price) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS ma7
FROM prices;
\`\`\`

Key functions: \`ROW_NUMBER\`, \`RANK\`, \`DENSE_RANK\`, \`LAG\`, \`LEAD\`, \`SUM/AVG/COUNT OVER\`, \`NTILE\`.

## CTEs (Common Table Expressions)
Named subqueries — more readable than nested.
\`\`\`sql
WITH active_users AS (
  SELECT id FROM users WHERE last_login > NOW() - INTERVAL '30 days'
),
high_spenders AS (
  SELECT user_id FROM orders GROUP BY user_id HAVING SUM(total) > 10000
)
SELECT u.id FROM active_users u JOIN high_spenders hs ON u.id = hs.user_id;
\`\`\`

### Recursive CTE
\`\`\`sql
-- Organization hierarchy
WITH RECURSIVE subordinates AS (
  SELECT id, manager_id, name FROM employees WHERE id = 1  -- start
  UNION ALL
  SELECT e.id, e.manager_id, e.name
  FROM employees e
  JOIN subordinates s ON e.manager_id = s.id
)
SELECT * FROM subordinates;
\`\`\`

## Indexes

### B-Tree (default)
Sorted tree. O(log n) lookup. Good for: equality, range, ORDER BY, prefix LIKE.
\`\`\`sql
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_orders_user_date ON orders (user_id, created_at DESC);
\`\`\`

### Composite Index Gotchas
Order matters! Index on \`(user_id, created_at)\` helps:
- \`WHERE user_id = ?\` ✓
- \`WHERE user_id = ? AND created_at > ?\` ✓
- \`WHERE created_at > ?\` ✗ (can't use, must start from leftmost)

### Hash Index
O(1) lookup but no range queries. Postgres: only for \`=\`.

### Partial Index
Only indexes rows matching a predicate (saves space):
\`\`\`sql
CREATE INDEX idx_pending ON orders (created_at) WHERE status = 'pending';
\`\`\`

### Covering Index
Includes all columns needed by query → no heap lookup.
\`\`\`sql
CREATE INDEX idx_email_covering ON users (email) INCLUDE (name, age);
\`\`\`

## EXPLAIN / Query Plans
Always check before prod.
\`\`\`sql
EXPLAIN ANALYZE SELECT ...;
\`\`\`
Look for: Seq Scan (bad for large tables), Nested Loop with millions of rows, missing indexes.

## N+1 Problem
\`\`\`js
// BAD — 1 query + N queries
const users = await db.query('SELECT * FROM users');
for (const u of users) {
  u.orders = await db.query('SELECT * FROM orders WHERE user_id = ?', u.id);
}

// GOOD — 2 queries
const users = await db.query('SELECT * FROM users');
const orders = await db.query('SELECT * FROM orders WHERE user_id = ANY(?)', users.map(u => u.id));
// Then group in JS
\`\`\`

ORMs have this problem built-in. Use DataLoader, \`.include()\`, or \`JOIN\`.`,
  },
  {
    id: "be-acid",
    cat: "Databases",
    n: "Transactions & Isolation Levels",
    s: "ACID, phenomena (dirty/phantom), MVCC.",
    depth: "deep",
    level: "L2",
    detail: `## ACID
- **Atomicity** — all-or-nothing (commit or rollback)
- **Consistency** — valid state transitions (constraints enforced)
- **Isolation** — concurrent txns don't interfere (depends on level)
- **Durability** — committed data survives crashes (WAL + fsync)

## Concurrency Phenomena
- **Dirty Read** — read uncommitted data
- **Non-repeatable Read** — same row read twice gives different result
- **Phantom Read** — same query returns different row sets (INSERT happened)
- **Lost Update** — two writers overwrite each other

## Isolation Levels
| Level | Dirty | Non-repeatable | Phantom |
| --- | --- | --- | --- |
| Read Uncommitted | ✓ | ✓ | ✓ |
| Read Committed | ✗ | ✓ | ✓ |
| Repeatable Read | ✗ | ✗ | ✓ |
| Serializable | ✗ | ✗ | ✗ |

Postgres default: **Read Committed**. MySQL InnoDB default: **Repeatable Read**.

## MVCC (Multi-Version Concurrency Control)
Each write creates a new version. Readers see a snapshot at txn start.
- Readers don't block writers, writers don't block readers
- Postgres, MySQL InnoDB implement MVCC
- Cost: storage for versions + VACUUM/cleanup

## Implementing Serializable
- **Strict 2PL** — acquire locks, release at commit (can deadlock)
- **SSI (Serializable Snapshot Isolation)** — Postgres: detect conflicts at commit, abort one

## Transaction Patterns
### Optimistic Locking (version column)
\`\`\`sql
UPDATE accounts
SET balance = 100, version = version + 1
WHERE id = 1 AND version = 5;
-- 0 rows affected → retry with fresh read
\`\`\`

### Pessimistic Locking
\`\`\`sql
BEGIN;
SELECT * FROM inventory WHERE id = 1 FOR UPDATE;  -- row lock
-- ... work ...
COMMIT;
\`\`\`

## Deadlock
Two txns waiting for each other's locks.
- DBs detect and abort one (usually the "victim" with less work)
- Prevent: always acquire locks in same order
- Keep txns short, don't interact with external services inside

## Real-world Advice
- Default: Read Committed
- Repeatable Read for financial reports (consistency across queries)
- Serializable rarely (high abort rate under contention)
- Prefer idempotent writes + application-level retries`,
  },
  {
    id: "be-sharding",
    cat: "Databases",
    n: "Sharding & Partitioning",
    s: "Scale writes across nodes; consistent hashing.",
    depth: "deep",
    level: "L3",
    detail: `## Partitioning vs Sharding
- **Partitioning** — split one table into chunks on same DB
- **Sharding** — split across multiple DB nodes (horizontal scaling)

## Sharding Strategies

### 1. Range-based
Shard by key ranges. \`user_id 0-1M → shard1\`, \`1M-2M → shard2\`.
- **Pros:** efficient range queries
- **Cons:** hotspots (auto-increment IDs all go to newest shard)

### 2. Hash-based
\`shard = hash(key) % N\`.
- **Pros:** even distribution
- **Cons:** resharding is nightmare (remap all keys)

### 3. Consistent Hashing
Map keys + nodes onto a ring, each key goes to next node clockwise.
- Adding/removing a node only remaps ~1/N of keys
- Virtual nodes smooth distribution
- Used by: Cassandra, DynamoDB, Memcached, Redis cluster

![Consistent Hashing Ring](https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Consistent_Hashing_Sample_Illustration.png/800px-Consistent_Hashing_Sample_Illustration.png)

### 4. Directory-based
Lookup service maps key → shard. Flexible but adds a hop.

## Choosing a Shard Key
Critical decision. Bad keys cause:
- **Hotspots** — one shard gets all traffic
- **Cross-shard queries** — expensive scatter-gather
- **Skew** — shards with different data volumes

Good keys:
- High cardinality (many unique values)
- Even access distribution
- Aligns with access patterns (most queries filter by this key)

Examples:
- User-centric app: shard by \`user_id\`
- Multi-tenant SaaS: shard by \`tenant_id\`
- Timeseries: shard by \`(tenant_id, time_bucket)\` — avoid pure time (hotspot)

## Cross-Shard Problems

### Queries
Scatter-gather (query all shards, merge). Expensive.
Solutions:
- Denormalize
- Global secondary indexes
- Search engine (Elasticsearch) for multi-dimensional queries

### Transactions
No native 2PC in most sharded systems.
- Saga pattern
- Eventual consistency
- Design to avoid cross-shard writes

### Resharding
When you outgrow current shard count:
- **Double**: new key = hash % (N × 2); keep old N × 2 split reads
- **Consistent hashing**: easier incremental rebalance
- **Directory**: update lookup → move data

## Practical Advice
- Don't shard until you've tried: vertical scaling, read replicas, caching, archiving old data
- Choose shard key carefully — hardest to change
- Always include shard key in queries if possible
- Monitor per-shard load — rebalance proactively`,
  },
  {
    id: "be-nosql",
    cat: "Databases",
    n: "NoSQL Databases",
    s: "Document, KV, Column, Graph — when and why.",
    depth: "medium",
    level: "L2",
    detail: `## Types of NoSQL

### Document (MongoDB, Couchbase, Firestore)
Store JSON-like documents. Schema-flexible.
\`\`\`json
{ "_id": "user1", "name": "Alex", "addresses": [{...}] }
\`\`\`
Good for: evolving schemas, nested data, content management.
Bad for: complex joins, strong consistency.

### Key-Value (Redis, DynamoDB, Memcached)
Simple: key → value. Often in-memory.
Good for: cache, sessions, counters, leaderboards.
Bad for: queries beyond key lookup.

### Wide-Column (Cassandra, HBase, ScyllaDB)
Rows with dynamic columns. Optimized for writes.
\`\`\`
RowKey: user1 | col:name=Alex | col:email=a@b.com | col:login:2024-01-01=ip:1.2.3.4
\`\`\`
Good for: time-series, logs, IoT, high write throughput, multi-DC.
Bad for: ad-hoc queries, small datasets.

### Graph (Neo4j, Amazon Neptune, ArangoDB)
Nodes + edges. Traverse relationships fast.
Good for: social networks, fraud detection, recommendation, knowledge graphs.
Bad for: tabular data.

## CAP Theorem (revisit with NoSQL)
In a partition, choose Consistency or Availability.
- **CP**: MongoDB (w=majority), HBase, ZooKeeper
- **AP**: Cassandra, DynamoDB, CouchDB
- RDBMS: typically CP

## Consistency Models Spectrum
Strong → Linearizable → Sequential → Causal → Read-your-writes → Eventual

Cassandra tunable: \`ONE\`, \`QUORUM\`, \`ALL\` per query (trade-off at query time).

## When to Use SQL vs NoSQL

### Use SQL (Postgres) when:
- Data has clear schema
- Complex queries with joins
- Transactions across tables
- Default choice — most apps

### Use NoSQL when:
- Specific access patterns fit a model (KV, document, graph)
- Need extreme scale (billions of rows)
- Schema evolves rapidly
- Specialized needs (time-series, full-text search, graph traversal)

## Polyglot Persistence
Use multiple DBs — right tool per job.
- **Postgres** for core transactional data
- **Redis** for cache & sessions
- **Elasticsearch** for search
- **Kafka** for event streaming
- **S3** for blobs

## Common Pitfall
NoSQL is often chosen for hype, not fit. Postgres with JSONB columns + indexes handles 90% of "we need NoSQL" cases with way less operational complexity.`,
  },

  // ─── Caching ───────────────────────────────────────────
  {
    id: "be-caching",
    cat: "Caching",
    n: "Caching Strategies",
    s: "Cache-aside, Read-through, Write-through/behind/around.",
    depth: "deep",
    level: "L2",
    detail: `## Why Cache
- Reduce DB load
- Lower latency
- Handle traffic spikes
- Save compute (API calls, rendering)

## Strategies

### 1. Cache-Aside (Lazy Loading) — most common
\`\`\`
Read: check cache → miss → fetch DB → set cache → return
Write: update DB → invalidate cache
\`\`\`
Pros: simple, only caches what's needed. Cons: cache miss on first request, stale risk.

### 2. Read-Through
Cache loads from DB on miss automatically. App only talks to cache.
\`\`\`
Read: cache.get(k) → cache internally fetches from DB if miss
\`\`\`
Pros: app logic simpler. Cons: need smart cache layer (DAX, Redis modules).

### 3. Write-Through
Every write goes to cache + DB synchronously.
\`\`\`
Write: cache.set(k, v) + db.save(k, v) (both in one op)
\`\`\`
Pros: cache always fresh. Cons: higher write latency.

### 4. Write-Behind (Write-Back)
Write to cache, flush to DB async.
\`\`\`
Write: cache.set(k, v) → queue → DB (eventual)
\`\`\`
Pros: fast writes, batches. Cons: data loss if cache fails before flush. Requires durable queue.

### 5. Write-Around
Writes go directly to DB, skip cache. Reads populate cache.
Good when data is written rarely but read often.

### 6. Refresh-Ahead
Pre-refresh before expiry based on access patterns.

## Cache Invalidation — "one of the two hard things"
- **TTL** — time-based (simple, can be stale)
- **Event-based** — invalidate on DB write (precise but coupling)
- **Version tags** — bump version prefix to invalidate all keys

### Tagged Invalidation
\`\`\`
cache.set('user:1', userData, { tags: ['user:1', 'users'] })
cache.invalidateTag('users')  // clears all user keys
\`\`\`

## Cache Stampede (Dogpile)
Hot key expires → many concurrent requests hit DB.

Solutions:
- **Single-flight** — first request populates, others wait
- **Probabilistic early refresh** — refresh before expiry with small probability
- **Mutex / distributed lock** on cache miss
- **Stale-while-revalidate** — return stale while refreshing

## Eviction Policies
- **LRU** (Least Recently Used) — default in Redis
- **LFU** (Least Frequently Used) — good for long-tail
- **FIFO** — oldest first
- **TTL** — on expiry
- **Random** — surprisingly OK

## Where to Cache
1. **Browser** — long cache for static assets, cookies for identity
2. **CDN** — edge cache, serve close to user
3. **Reverse proxy** (Varnish, NGINX) — server-side HTTP cache
4. **Application** (Redis, Memcached) — distributed
5. **Local (in-process)** — fastest, not shared
6. **DB query cache** — built-in, less common now

## Metrics
- Hit ratio — aim for >80% for hot data
- Miss latency — DB load in cache misses
- Eviction rate — cache size too small?
- Stampede rate — concurrent misses on same key`,
  },
  {
    id: "be-redis",
    cat: "Caching",
    n: "Redis Deep Dive",
    s: "Data structures, persistence, cluster, pub/sub.",
    depth: "deep",
    level: "L2",
    detail: `## Why Redis
Single-threaded, in-memory, but handles 100K+ ops/sec. Atomic commands = no locking.

## Data Structures (this is why it's special)
- **Strings** — \`SET\`, \`GET\`, \`INCR\`, \`SETEX\` (with TTL)
- **Lists** — \`LPUSH\`, \`RPOP\` — queues, timelines
- **Sets** — \`SADD\`, \`SMEMBERS\`, \`SINTER\` — tags, unique things
- **Sorted Sets (ZSET)** — \`ZADD\`, \`ZRANGEBYSCORE\` — leaderboards, time-ordered
- **Hashes** — \`HSET\`, \`HGETALL\` — object fields
- **Streams** — append-only log (since 5.0), like Kafka-lite
- **HyperLogLog** — approximate unique count, 12KB for billions
- **Bitmaps** — \`SETBIT\`, \`BITCOUNT\` — user flags
- **Geospatial** — \`GEOADD\`, \`GEORADIUS\`

## Common Patterns
### Rate Limiter (Fixed Window)
\`\`\`
INCR rate:user:123:2024-01-01T12:00
EXPIRE rate:user:123:2024-01-01T12:00 60
-- If value > limit, reject
\`\`\`

### Leaderboard
\`\`\`
ZADD leaderboard 500 player1
ZADD leaderboard 750 player2
ZREVRANGE leaderboard 0 9 WITHSCORES  -- top 10
ZREVRANK leaderboard player1           -- player's rank
\`\`\`

### Distributed Lock
\`\`\`
SET lock:resource1 uuid-123 NX EX 30
-- Do work
DEL lock:resource1 (check uuid matches via Lua)
\`\`\`

### Session Store
\`\`\`
SETEX session:abc123 3600 "{\\"userId\\":42}"
\`\`\`

### Pub/Sub
\`\`\`
PUBLISH channel:orders "order-42"
SUBSCRIBE channel:orders
\`\`\`

## Persistence
- **RDB** — snapshots (periodic, compact)
- **AOF** — append-only log of every write (durability)
- Both can be enabled; tradeoff durability vs perf

## Cluster Mode
- Partitioned (16384 hash slots across nodes)
- No cross-slot transactions (solve with hashtags: \`user:{123}:profile\`, \`user:{123}:orders\`)
- Client-side routing via \`MOVED\` / \`ASK\` redirects

## Sentinel
High availability for non-cluster Redis. Monitors master, promotes replica on failure.

## Lua Scripting
Atomic multi-command operations.
\`\`\`lua
-- Atomic get-and-decrement
local v = redis.call('GET', KEYS[1])
if v and tonumber(v) > 0 then
  return redis.call('DECR', KEYS[1])
end
return nil
\`\`\`

## Common Mistakes
- Using \`KEYS *\` in prod (blocks) — use \`SCAN\`
- Not setting \`maxmemory\` → OOM
- Storing large objects without serialization strategy
- Treating it as durable DB (it's cache-first)`,
  },

  // ─── Messaging ─────────────────────────────────────────
  {
    id: "be-kafka",
    cat: "Messaging",
    n: "Kafka Architecture",
    s: "Distributed log, partitions, consumer groups, exactly-once.",
    depth: "deep",
    level: "L2",
    detail: `## Kafka = Distributed Log
Append-only, replicated, partitioned log. Not a queue — a commit log.

![Kafka Architecture](https://kafka.apache.org/25/images/kafka-apis.png)

## Core Concepts
- **Broker** — Kafka server (cluster has multiple)
- **Topic** — logical feed ("orders", "user-events")
- **Partition** — ordered, immutable sequence; unit of parallelism
- **Replica** — each partition replicated (leader + followers)
- **Producer** — writes to topic; picks partition (key hash or round-robin)
- **Consumer** — reads from topics, tracks **offset** per partition
- **Consumer Group** — multiple consumers share workload; each partition consumed by one member
- **ISR** (In-Sync Replicas) — replicas caught up with leader

## Ordering Guarantees
Ordered within a partition. NOT ordered across partitions.
- Same key → same partition → ordered
- Choose key wisely: user_id, order_id, account_id

## Delivery Semantics
- **At-most-once** — fire and forget (can lose)
- **At-least-once** — retry until ack (duplicates possible) — default
- **Exactly-once** — idempotent producer + transactions (EOS mode)

## Why Kafka is Fast
- Sequential disk writes (faster than random)
- Page cache + zero-copy (\`sendfile()\`)
- Batching + compression
- No per-message disk sync (configurable)

## vs RabbitMQ
| | Kafka | RabbitMQ |
|---|---|---|
| Model | Log (replay) | Queue (delete on ack) |
| Throughput | 100K-1M msg/s | 10K-50K msg/s |
| Consumers | Pull | Push (usually) |
| Retention | Days/weeks | Until consumed |
| Routing | Topic + partition | Exchanges, bindings, headers |
| Use case | Event streaming | Task queues, RPC |

## Patterns
### Event Sourcing
Store every state change as event. Rebuild state by replaying.
\`\`\`
order.created → order.paid → order.shipped → order.delivered
\`\`\`

### CQRS
Commands write to Kafka → separate read models consume events into query-optimized DBs.

### Log Compaction
Kafka can retain only latest value per key (like a changelog).
Good for: config state, DB snapshots.

## Partitioning Strategy
- More partitions = more parallelism = more overhead
- Rule of thumb: 10× max consumer instances
- Can't reduce partitions (only add) — plan ahead
- Each broker handles ~1000-4000 partitions max

## Gotchas
- Rebalance pauses consumers (tune session timeout)
- Hot partitions (skewed keys)
- Unbounded log if no retention policy
- Ordering only within partition (global ordering = 1 partition = no parallelism)`,
  },

  // ─── API Design ────────────────────────────────────────
  {
    id: "be-rest",
    cat: "API Design",
    n: "REST API Best Practices",
    s: "Resource naming, HTTP methods, idempotency, versioning.",
    depth: "medium",
    level: "L2",
    detail: `## Resource-Oriented Design
URLs = nouns. HTTP methods = verbs.

\`\`\`
GET    /users            # list
POST   /users            # create
GET    /users/123        # read one
PUT    /users/123        # full replace
PATCH  /users/123        # partial update
DELETE /users/123        # delete

GET    /users/123/orders # nested sub-resource
\`\`\`

## HTTP Methods

| Method | Safe | Idempotent | Cacheable |
| --- | --- | --- | --- |
| GET | ✓ | ✓ | ✓ |
| HEAD | ✓ | ✓ | ✓ |
| POST | ✗ | ✗ | Rarely |
| PUT | ✗ | ✓ | ✗ |
| PATCH | ✗ | ✗ (usually) | ✗ |
| DELETE | ✗ | ✓ | ✗ |

- **Safe**: no side effects
- **Idempotent**: multiple identical requests = same effect as one

## Status Codes
### 2xx
- 200 OK — success with body
- 201 Created — new resource (include Location header)
- 204 No Content — success, no body

### 3xx
- 301 Moved Permanently
- 304 Not Modified (cache hit)

### 4xx (client error)
- 400 Bad Request — malformed
- 401 Unauthorized — missing/invalid auth
- 403 Forbidden — authenticated but not allowed
- 404 Not Found
- 409 Conflict — version mismatch, duplicate
- 422 Unprocessable — validation failed
- 429 Too Many Requests — rate limited

### 5xx (server error)
- 500 Internal — unexpected
- 502 Bad Gateway — upstream failed
- 503 Service Unavailable — overload/maintenance
- 504 Gateway Timeout

## Idempotency for POST
POSTs aren't idempotent by default. But retrying a failed order shouldn't create a duplicate.

**Solution**: idempotency key.
\`\`\`
POST /orders
Idempotency-Key: abc-123
\`\`\`
Server stores (key → response) for N hours. Retry with same key → returns cached response.

## Pagination
- **Offset**: \`?page=2&limit=20\` (simple, bad for large datasets)
- **Cursor**: \`?after=xyz&limit=20\` (stable, scales)

Always include total count or next/prev links.

## Filtering, Sorting
\`\`\`
GET /orders?status=pending&sort=-created_at&limit=20
\`\`\`

## Versioning
- **URL**: \`/v1/users\` — explicit, cacheable
- **Header**: \`Accept: application/vnd.api+json;version=1\` — cleaner URLs
- **Query param**: \`?v=1\` — simple

Strong preference: URL versioning. Breaks rarely, documents easily.

## Error Responses
\`\`\`json
{
  "error": {
    "code": "INVALID_EMAIL",
    "message": "Email is invalid",
    "field": "email",
    "requestId": "req-abc-123"
  }
}
\`\`\`

## HATEOAS
Responses include links to related actions. Great in theory, rarely used in practice.

## Content Negotiation
\`Accept: application/json\` vs \`application/xml\` — return appropriate format.`,
  },
  {
    id: "be-graphql",
    cat: "API Design",
    n: "GraphQL",
    s: "Schema-first, resolver-based, N+1 problem.",
    depth: "medium",
    level: "L2",
    detail: `## Why GraphQL
- Clients request exactly what they need (no over/under-fetching)
- Single endpoint, typed schema
- Strong introspection (auto-generated docs, type-safe clients)
- Evolving API without versions

## Schema
\`\`\`graphql
type User {
  id: ID!
  name: String!
  orders(limit: Int = 10): [Order!]!
}
type Order {
  id: ID!
  total: Float!
  user: User!
}
type Query {
  user(id: ID!): User
  users(limit: Int): [User!]!
}
type Mutation {
  createOrder(userId: ID!, total: Float!): Order!
}
type Subscription {
  orderCreated: Order!
}
\`\`\`

## Query
\`\`\`graphql
query GetUser {
  user(id: "123") {
    name
    orders(limit: 5) {
      id
      total
    }
  }
}
\`\`\`
Response matches query shape.

## Resolvers
Functions that fetch data for fields.
\`\`\`js
const resolvers = {
  Query: {
    user: (_, { id }, ctx) => ctx.db.user.findById(id),
  },
  User: {
    orders: (user, { limit }, ctx) =>
      ctx.db.order.findMany({ where: { userId: user.id }, take: limit }),
  },
};
\`\`\`

## N+1 Problem (CRITICAL)
Naive resolvers hit DB once per parent:
\`\`\`
query { users { orders { total } } }
\`\`\`
→ 1 query for users, N queries for each user's orders.

### Solution: DataLoader
Batches + caches per-request.
\`\`\`js
const ordersByUser = new DataLoader(async (userIds) => {
  const orders = await db.orders.findMany({ where: { userId: { in: userIds } } });
  return userIds.map(uid => orders.filter(o => o.userId === uid));
});

// Resolver
orders: (user, _, ctx) => ctx.loaders.ordersByUser.load(user.id)
\`\`\`

## Caching
Tricky — every query is unique. Options:
- Persisted queries (hash queries → cache by hash)
- Response cache at resolver level
- Normalized client cache (Apollo, Relay, urql)

## Subscriptions
Realtime via WebSockets. Push on events.

## vs REST
| | REST | GraphQL |
|---|---|---|
| Endpoints | Many | One |
| Over-fetching | Common | Rare |
| Under-fetching | Common (need multiple) | Rare (one query) |
| Caching | HTTP layer (easy) | Custom (harder) |
| Errors | HTTP status | Always 200, errors in body |
| Learning curve | Low | Medium |

## When to Use
- Mobile apps with varying needs (different screens, different fields)
- BFF for frontend — aggregate microservices
- Public API where clients have varying needs (GitHub, Shopify)

## When Not
- Simple CRUD with stable clients — REST is simpler
- Real-time heavy (use WebSocket directly)
- Cache-heavy public content (REST + CDN wins)

## Modern Alternative: tRPC
End-to-end typesafety for TypeScript monorepos. Skip schema language, derive types from server functions.`,
  },
  {
    id: "be-grpc",
    cat: "API Design",
    n: "gRPC",
    s: "HTTP/2, Protocol Buffers, streaming, code gen.",
    depth: "medium",
    level: "L2",
    detail: `## gRPC
Remote Procedure Call framework by Google. HTTP/2 + Protocol Buffers.

## Protocol Buffers (protobuf)
Schema + binary serialization.
\`\`\`proto
syntax = "proto3";

message User {
  string id = 1;
  string name = 2;
  int32 age = 3;
}

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
  rpc ListUsers (ListUsersRequest) returns (stream User);  // server streaming
}
\`\`\`

\`protoc\` generates client + server code in every supported language.

## 4 RPC Types
1. **Unary** — single req/single resp (like REST)
2. **Server streaming** — client req → server streams back
3. **Client streaming** — client streams → server returns single resp
4. **Bidirectional streaming** — both stream

## Why gRPC
- **Fast** — binary, HTTP/2 multiplexing, no JSON parsing overhead (10x faster than REST in benchmarks)
- **Strongly typed** — contracts enforced, code generation
- **Streaming** — first-class support
- **Cross-language** — same .proto works in Go, Java, Python, etc.

## Trade-offs
- Not browser-native (need gRPC-Web proxy)
- Harder debugging (binary)
- Less human-readable
- Firewall/proxy sometimes mangle HTTP/2
- Smaller ecosystem than REST

## When to Use
- Internal microservice communication
- Low-latency, high-throughput
- Polyglot service ecosystem
- Streaming needs

## When NOT
- Public APIs consumed by browsers
- Simple CRUD with REST satisfying needs

## vs REST vs GraphQL
| | REST | GraphQL | gRPC |
|---|---|---|---|
| Format | JSON | JSON | Binary (protobuf) |
| Transport | HTTP/1.1+ | HTTP | HTTP/2 |
| Typing | Optional | Schema | Strict (.proto) |
| Streaming | SSE/WebSocket | Subscriptions | Native |
| Browser | ✓ | ✓ | With proxy |
| Best for | Public APIs | Mobile/BFF | Internal microservices |`,
  },

  // ─── Microservices ─────────────────────────────────────
  {
    id: "be-distributed-txn",
    cat: "Microservices",
    n: "Distributed Transactions",
    s: "2PC, Saga (Choreography vs Orchestration), Outbox.",
    depth: "deep",
    level: "L3",
    detail: `## The Problem
In microservices, a business op spans multiple services/DBs. Can't use a single DB transaction.

Example: "Place order" = deduct inventory + charge payment + notify shipping.

## Two-Phase Commit (2PC)
Coordinator asks each participant: "can you commit?" → if all yes, tells them to commit; else abort.

**Pros:** strong consistency
**Cons:** blocking (if coordinator fails, participants stuck); SPOF; poor availability; poor latency

Rarely used in internet-scale systems. Still used in databases (XA transactions).

## Saga Pattern (preferred)
Sequence of local transactions. If one fails, execute **compensating transactions** to undo.

### Choreography
Services publish events; others react. No central coordinator.
\`\`\`
Order.Created → Payment service → Payment.Charged → Inventory → Inventory.Reserved
\`\`\`
If Inventory fails → Inventory.ReserveFailed → Payment.Refunded → Order.Cancelled

**Pros:** decentralized, loose coupling
**Cons:** hard to understand full flow, cyclic dependencies possible

### Orchestration
Central orchestrator tells each service what to do.
\`\`\`
Orchestrator:
  1. Payment.charge()
  2. Inventory.reserve() — fails
  3. Payment.refund() (compensation)
  4. Order.cancel()
\`\`\`

**Pros:** explicit, observable
**Cons:** orchestrator is SPOF (mitigated by state machines + retries)

## Outbox Pattern
Problem: "Dual write" — atomically update DB and publish message. Can't do both.

Solution:
1. Service writes data + event to same DB in one txn
2. Separate process polls outbox table → publishes to Kafka
3. Marks sent

\`\`\`
BEGIN;
  UPDATE orders SET status = 'paid' WHERE id = 1;
  INSERT INTO outbox (topic, payload) VALUES ('order.paid', '{...}');
COMMIT;
-- Background poller picks up outbox, publishes to Kafka, deletes/marks
\`\`\`

Now publishing is guaranteed if DB write succeeds.

## Idempotency — Non-negotiable
Every service operation must be safe to retry. Use **idempotency keys** (UUID per logical request).

\`\`\`
POST /orders
Idempotency-Key: abc-123  ← client generates, server stores (key → response)
\`\`\`

## Compensating Actions
Can't always perfectly undo (email already sent, item already shipped).
Soft-delete / cancel flags + human review > actually reversing.

## Patterns & Tools
- **Temporal / Zeebe** — workflow engines for long-running orchestration
- **Debezium** — CDC (change data capture) for outbox without polling
- **Event sourcing** + **CQRS** — natural fit with sagas

## Interview Expectations
Know:
1. Why 2PC is avoided
2. Saga Choreography vs Orchestration (when to use each)
3. Outbox pattern solves dual-write
4. Idempotency keys for every mutation endpoint
5. Eventual consistency is acceptable — design UX for "in progress" states`,
  },
  {
    id: "be-resilience",
    cat: "Microservices",
    n: "Resilience Patterns",
    s: "Circuit breaker, retry, bulkhead, timeout, fallback.",
    depth: "deep",
    level: "L2",
    detail: `## Resilience = Stay Up When Things Fail

### Retry with Exponential Backoff + Jitter
Don't hammer a failing service.
\`\`\`
delay = min(cap, base * 2^attempt) + random(0, jitter)
attempt 1: 1s + 0-1s
attempt 2: 2s + 0-1s
attempt 3: 4s + 0-1s
attempt 4: 8s + 0-1s
\`\`\`
Always jitter — otherwise all clients retry at same time (thundering herd).

### Circuit Breaker
Stop calling a broken service to let it recover.

States: **Closed** (normal) → **Open** (fail fast) → **Half-Open** (test recovery)

\`\`\`
Closed:   Calls pass. Count failures. If > threshold → Open.
Open:     Fail immediately (don't call). After timeout → Half-Open.
Half-Open: Allow small % through. Success → Closed. Failure → Open.
\`\`\`

Libraries: Hystrix (deprecated), Resilience4j (Java), Polly (.NET), failsafe-go.

### Bulkhead
Isolate resources so one failure doesn't sink the ship.
- Separate thread pools per dependency
- Separate connection pools
- Separate services on separate hosts

Named after ship compartments — flood one, others stay dry.

### Timeout
Every network call needs a timeout. Never default to infinite.
\`\`\`
Connect timeout: 5s
Read timeout: 30s (tuned per API)
Total deadline: propagate from request (gRPC supports this natively)
\`\`\`

### Fallback
If operation fails, return degraded response.
- Empty list, default value, cached data
- "Recommendations unavailable" instead of erroring the whole page

### Backpressure
Upstream slows down when downstream overwhelmed.
- Kafka consumer lag → slow producers?
- 429 Too Many Requests → client backs off
- Reactive Streams (RxJava, Reactor)

## Chaos Engineering
Proactively inject failures to find weaknesses.
- **Chaos Monkey** (Netflix) — kills random VMs
- **Gremlin**, **Litmus** — controlled fault injection
- Game days — scheduled exercises

## Monitoring for Resilience
- **SLI/SLO/SLA** — define what "working" means
- **RED metrics** — Rate, Errors, Duration
- **USE metrics** — Utilization, Saturation, Errors (for resources)
- **Alerts** — based on SLO burn rate, not individual errors

## Health Checks
- **Liveness** — is the process alive? K8s restarts if fails
- **Readiness** — can it serve traffic? K8s removes from LB if fails

## Graceful Degradation
Design features to gracefully fail.
- Reviews service down? Show product without reviews.
- Recommendations down? Show default list.
- Better a functional page than a 500.`,
  },
  {
    id: "be-observability",
    cat: "Microservices",
    n: "Observability (Logs, Metrics, Traces)",
    s: "Three pillars; OpenTelemetry; distributed tracing.",
    depth: "deep",
    level: "L2",
    detail: `## Three Pillars

### 1. Logs
Discrete events. What happened?
- **Unstructured** — "User 123 logged in" (grep-able but hard to query)
- **Structured** — \`{ event: "login", userId: 123, ip: "1.2.3.4" }\` — query-able, aggregatable

Always structured. Use JSON.

### 2. Metrics
Aggregated numeric data over time. How much? How fast?
- Counter (monotonic: requests_total)
- Gauge (up/down: memory_usage)
- Histogram (distribution: request_duration)

Prometheus is de facto standard. Grafana for visualization.

### 3. Traces
Request flow across services. Where did time go?
- **Span** — single operation (DB query, service call)
- **Trace** — tree of spans (root span + children)
- **Context propagation** — pass trace ID across services

![Distributed Trace](https://opentelemetry.io/img/logos/opentelemetry-stacked-color.png)

## OpenTelemetry (OTel)
Vendor-neutral standard for collecting telemetry. Instruments code once, exports to any backend (Jaeger, Zipkin, Datadog, Honeycomb).

\`\`\`js
import { trace } from '@opentelemetry/api';
const tracer = trace.getTracer('my-service');

async function handleRequest(req) {
  return tracer.startActiveSpan('handle-request', async (span) => {
    span.setAttribute('user.id', req.userId);
    const data = await fetchData();
    span.end();
    return data;
  });
}
\`\`\`

## RED vs USE Metrics

### RED (services)
- **Rate** — requests/sec
- **Errors** — error rate
- **Duration** — latency (p50, p95, p99)

### USE (resources)
- **Utilization** — % in use
- **Saturation** — queued work
- **Errors** — error count

## SLI / SLO / SLA
- **SLI** — Service Level Indicator (what you measure: latency, error rate)
- **SLO** — Service Level Objective (what you commit internally: 99.9% success)
- **SLA** — Service Level Agreement (what you commit to customers, with penalties)

## Error Budget
If SLO is 99.9%, error budget = 0.1% (43.2 min downtime/month). Use it wisely — too many ship too aggressively → burn budget → freeze.

## Common Tools
- **Prometheus + Grafana** — metrics
- **Jaeger / Zipkin / Tempo** — traces
- **ELK (Elasticsearch + Logstash + Kibana)** / **Loki** — logs
- **Datadog, New Relic, Honeycomb** — all-in-one SaaS

## Sampling
Can't trace every request at scale.
- **Head-based** — sample X% at start (loses interesting errors)
- **Tail-based** — decide after trace complete (keep errors, slow requests)

## Correlation
Use trace ID to correlate logs, metrics, traces. Essential for debugging.
\`\`\`
[traceId=abc-123] GET /api/checkout 200 150ms
[traceId=abc-123] DB query 45ms
[traceId=abc-123] Payment call failed: timeout
\`\`\``,
  },

  // ─── Concurrency ───────────────────────────────────────
  {
    id: "be-concurrency",
    cat: "Concurrency",
    n: "Thread Safety & Synchronization",
    s: "Mutex, Semaphore, Atomic ops, Lock-free DS, deadlocks.",
    depth: "deep",
    level: "L2",
    detail: `## The Problem
Multiple threads sharing mutable state → race conditions, inconsistent data.

## Primitives

### Mutex (Mutual Exclusion)
Only one thread holds the lock at a time.
\`\`\`java
private final Object lock = new Object();
synchronized(lock) {
  balance -= amount;
}
\`\`\`

### Read-Write Lock
Multiple readers OR one writer.
Good when reads >> writes.

### Semaphore
Counter — allow N concurrent holders. Used for resource pools.
\`\`\`
Semaphore connections = new Semaphore(10);
connections.acquire();  // wait if all 10 in use
// use connection
connections.release();
\`\`\`

### Atomic Operations
Hardware-supported, no locks.
\`\`\`java
AtomicInteger counter = new AtomicInteger();
counter.incrementAndGet();
counter.compareAndSet(0, 1);  // CAS
\`\`\`

### CAS (Compare-And-Swap)
Atomic: "if current value is X, set to Y."
Foundation of lock-free algorithms.
\`\`\`
while (true) {
  int current = atomic.get();
  int next = current + 1;
  if (atomic.compareAndSet(current, next)) break;  // Retry on conflict
}
\`\`\`

## Deadlock
Two threads holding locks waiting for each other.
\`\`\`
T1: lock(A) → waits for B
T2: lock(B) → waits for A
\`\`\`

Prevention:
- Always acquire locks in same order
- Use tryLock with timeout
- Detect (DB has deadlock detector, picks victim)

## Livelock
Threads keep retrying but make no progress. Usually from over-aggressive deadlock avoidance.

## Starvation
A thread never gets the resource. Usually priority inversion or unfair scheduler.

## Lock-Free Data Structures
Use CAS + careful ordering.
- \`ConcurrentHashMap\` (lock-free reads, striped writes)
- \`AtomicReference\` for linked list pointers
- Michael-Scott queue

Pros: no blocking, no deadlock
Cons: hard to design correctly, CPU-intensive retries under contention

## Memory Model
CPU reorders reads/writes for performance. Without memory barriers, threads see different states.

- \`volatile\` in Java — read/write happens-before guarantees
- Atomic classes include barriers
- Java Memory Model (JMM) defines rules

## Concurrency Patterns

### Producer-Consumer
Queue + one producer + one consumer. BlockingQueue handles it.

### Thread Pool
Fixed workers pull from task queue. ExecutorService in Java, goroutine pool in Go.

### Actor Model
Isolated actors communicate via messages. No shared state.
- Akka (Scala/Java)
- Erlang/Elixir processes

### CSP (Go channels)
Share memory by communicating.
\`\`\`go
ch := make(chan int)
go func() { ch <- 42 }()
fmt.Println(<-ch)  // receives
\`\`\`

## Virtual Threads (Java 21, Project Loom)
Lightweight threads scheduled by JVM. Millions of them feasible.
\`\`\`java
Thread.startVirtualThread(() -> doWork());
\`\`\`

## Common Interview Qs
- Implement thread-safe counter (AtomicInteger or CAS loop)
- Producer-consumer with bounded buffer
- Dining Philosophers (deadlock avoidance)
- Readers-Writers problem`,
  },

  // ─── Security ──────────────────────────────────────────
  {
    id: "be-auth",
    cat: "Security",
    n: "Authentication & Authorization (JWT, OAuth2, OIDC)",
    s: "Session vs JWT, OAuth flows, RBAC/ABAC, PKCE.",
    depth: "deep",
    level: "L2",
    detail: `## Sessions vs JWT

### Session
Server stores session state (DB/Redis). Client holds session ID in cookie.
\`\`\`
Login → server creates session → Set-Cookie: sid=xxx
Every request → server looks up sid → gets user
\`\`\`
- **Pros:** revocable instantly, simple
- **Cons:** stateful (server affinity), shared session store needed at scale

### JWT
Self-contained token. Server signs; verifies signature on every request.
\`\`\`
JWT = header.payload.signature
payload = { sub: "user-123", exp: 1234567890, roles: ["admin"] }
\`\`\`
- **Pros:** stateless, scales horizontally
- **Cons:** can't revoke before expiry (without blacklist), larger than session ID

### JWT Gotchas
- Never store in localStorage (XSS can steal) → use **HttpOnly cookie**
- **Short expiry** (15 min) + **refresh token** (longer, rotating)
- Always verify signature — don't trust \`alg: none\`
- Include \`aud\`, \`iss\`, \`exp\` claims

## OAuth 2.0
Authorization framework. Allows an app to act on user's behalf without their password.

### Authorization Code + PKCE (recommended for all clients today)
\`\`\`
1. App → Auth Server: Please authorize code_challenge=S256(verifier)
2. User logs in, approves
3. Auth Server → App: here's auth code
4. App → Token Endpoint: code + code_verifier
5. Token Endpoint → App: access_token + refresh_token
\`\`\`
PKCE prevents code interception (important for mobile apps).

### Client Credentials
Machine-to-machine. No user involved.
\`\`\`
App → Token Endpoint: client_id + client_secret
Token Endpoint → App: access_token
\`\`\`

### Refresh Tokens
Short-lived access token + long-lived refresh token. Rotate refresh on use.

## OpenID Connect (OIDC)
Identity layer on OAuth 2.0.
- OAuth = authorization ("can do this action")
- OIDC = authentication ("who is the user")
- Adds ID token (JWT with user claims)

## Authorization Models

### RBAC (Role-Based Access Control)
User → Role → Permissions.
\`\`\`
alice: [admin]
admin: [users.read, users.write, posts.delete]
\`\`\`
Simple, but role explosion in complex domains.

### ABAC (Attribute-Based)
Rules over attributes.
\`\`\`
allow if user.department == resource.department
allow if user.role == "manager" AND resource.createdBy in user.reports
\`\`\`
More expressive, harder to audit.

### ReBAC (Relationship-Based)
Google Zanzibar model. Graph of permissions.
\`\`\`
document:doc-42 viewer user:alice
folder:fold-1 parent document:doc-42
alice inherits view from folder
\`\`\`
Used by Google Drive, Notion, Auth0 FGA, SpiceDB.

## Security Principles
- **Least privilege** — grant minimum needed
- **Defense in depth** — multiple layers (auth + authz + rate limit + audit)
- **Fail secure** — on error, deny not allow
- **Audit everything** — who did what when

## Common Mistakes
- Checking auth but forgetting authz ("IDOR" — user A reads user B's data)
- Using client-side authz for security
- Exposing JWT secrets
- Not rotating keys
- SSRF — server making requests to attacker-controlled URLs`,
  },

  // ─── OS & Networking ───────────────────────────────────
  {
    id: "be-os",
    cat: "OS",
    n: "Processes, Threads, Memory",
    s: "Process vs thread, context switch, virtual memory, page cache.",
    depth: "deep",
    level: "L2",
    detail: `## Process vs Thread

### Process
- Independent program instance
- Separate memory space (virtual address space)
- Heavy to create (fork, copy-on-write)
- Crash → isolated
- IPC via pipes, sockets, shared memory

### Thread
- Lightweight execution unit within process
- Shares memory with other threads
- Cheap to create
- Crash → whole process dies
- Communication via shared memory (needs locks)

### Virtual Threads / Fibers / Goroutines
User-space threads scheduled by runtime, not OS.
- Goroutines (Go) — 2KB stack, millions feasible
- Virtual threads (Java 21) — same idea
- Enables massive concurrency without OS thread overhead

## Context Switch
Switching between processes/threads has cost:
1. Save registers, stack pointer
2. Update page tables (process switch only)
3. Load new state
4. Invalidate TLB (process switch only)

Typical cost: microseconds. Expensive at high frequency.

## Virtual Memory
Each process sees a contiguous address space. Mapped to physical RAM by OS via page tables.

Benefits:
- Isolation (process can't read another's memory)
- More virtual than physical (swap to disk)
- Copy-on-write (fork is cheap)

### Page
Unit of memory (usually 4KB). Paged in/out of RAM.

### TLB (Translation Lookaside Buffer)
Cache of virtual → physical mappings. TLB miss = expensive.

## Page Cache
OS caches file reads in RAM. Reading same file = no disk I/O.
Critical for DB performance — why Postgres/MySQL rely on OS cache.

## Memory Layers
\`\`\`
Registers    (< 1ns, tiny)
L1 cache     (~1ns, ~32KB)
L2 cache     (~5ns, ~256KB)
L3 cache     (~20ns, ~8MB)
RAM          (~100ns, GBs)
SSD          (~100μs, TBs)
HDD          (~10ms, TBs)
Network      (~100ms, ~)
\`\`\`
Orders of magnitude — cache locality matters.

## File Descriptors
Integer handle to open resource (file, socket, pipe). Each process has limit (default 1024 on Linux, tunable).

## System Calls
Cross user→kernel boundary. Expensive (hundreds of ns).
- \`read\`, \`write\`, \`open\`, \`close\`
- \`epoll\` (Linux), \`kqueue\` (BSD) for event-driven I/O
- \`mmap\` — map file into memory, avoid read syscall per access

## Signals
Async notification: SIGINT (Ctrl-C), SIGTERM (graceful shutdown), SIGKILL (force).
Handle in process, or get killed.

## fork() vs exec()
- \`fork\` — copy current process (copy-on-write in practice)
- \`exec\` — replace current process image with new program
- Together: fork then exec = run new program while parent continues

## Common Interview Qs
- Difference between process and thread
- When use multi-process vs multi-thread?
- What's a zombie process? Orphan?
- How does \`ps\` work?
- Difference between select, poll, epoll`,
  },
  {
    id: "be-networking",
    cat: "Networking",
    n: "TCP/IP, TLS, HTTP/2/3 Deep Dive",
    s: "3-way handshake, TLS negotiation, QUIC, keepalive.",
    depth: "deep",
    level: "L2",
    detail: `## OSI Model (simplified)
\`\`\`
7. Application (HTTP, gRPC)
4. Transport   (TCP, UDP, QUIC)
3. Network     (IP)
2. Link        (Ethernet, WiFi)
1. Physical
\`\`\`

## TCP Three-Way Handshake
\`\`\`
Client → Server: SYN (seq=X)
Server → Client: SYN-ACK (seq=Y, ack=X+1)
Client → Server: ACK (ack=Y+1)
                 → Connection established
\`\`\`
1.5 RTTs before data flows.

## TCP Four-Way Close
\`\`\`
Client → Server: FIN
Server → Client: ACK
Server → Client: FIN
Client → Server: ACK
                 → Connection closed
\`\`\`

## TCP Features
- Reliable (retransmit lost packets)
- Ordered delivery
- Flow control (receiver window)
- Congestion control (slow start, AIMD, BBR)
- Nagle's algorithm (coalesce small writes) — disable with \`TCP_NODELAY\` for latency

### Keep-Alive
Reuse connection for multiple requests. Huge perf win.
\`\`\`
Connection: keep-alive  (HTTP/1.1 default)
\`\`\`

## UDP
No handshake, no ordering, no retransmit. Fire and forget.
Good for: real-time (video, games), DNS, logs.

## TLS (formerly SSL)
Encrypts + authenticates.

### TLS 1.3 Handshake (1 RTT)
\`\`\`
Client → Server: ClientHello (ciphers, key share)
Server → Client: ServerHello + cert + key share + Finished
Client → Server: Finished + data flows
\`\`\`
TLS 1.2 was 2 RTTs.

### 0-RTT (TLS 1.3)
Resume with stored keys → data in first flight. Risk: replay attacks (safe only for idempotent GETs).

### Certificate Chain
Your cert → Intermediate CA → Root CA (browser trust store).
Let's Encrypt makes this free + automated.

## HTTP Evolution

### HTTP/1.1
- Persistent connections (keep-alive)
- Pipelining (rarely works in practice due to HoL blocking)
- Head-of-Line blocking: one slow request blocks the connection
- Workaround: 6 connections per origin (browser limit)

### HTTP/2
- Multiplexed streams over one TCP connection
- Binary framing
- HPACK header compression
- Server push (rarely used, deprecated)
- Still has TCP-level HoL blocking (packet loss blocks all streams)

### HTTP/3 (QUIC)
- Runs on UDP (not TCP)
- Streams independent — no HoL at transport layer
- 0-RTT resumption
- Connection migration (IP change doesn't break connection — great for mobile)
- Built-in TLS 1.3

![HTTP/3 vs HTTP/2](https://upload.wikimedia.org/wikipedia/commons/thumb/e/e8/HTTP-2-vs-HTTP-3-Protocol-Stack.svg/800px-HTTP-2-vs-HTTP-3-Protocol-Stack.svg.png)

## Load Balancing

### L4 (TCP/IP)
Routes by IP + port. Fast, no knowledge of app.
- AWS NLB, HAProxy (tcp mode)

### L7 (Application)
Routes by HTTP path, header, cookie.
- AWS ALB, NGINX, Envoy, HAProxy (http mode)

### Algorithms
- Round Robin
- Least Connections
- IP Hash (sticky)
- Consistent Hashing (for session affinity)
- Weighted (some servers bigger)

## DNS
Translates names → IPs.
- Recursive resolver → Root → TLD → Authoritative
- TTL controls caching
- CNAME, A, AAAA, MX, TXT records
- DNS-based load balancing (geo-DNS)

## CDN
Cache content at edge (near users). Cloudflare, Fastly, AWS CloudFront, Akamai.
- Static asset caching
- Dynamic content acceleration (TLS, routing)
- DDoS protection
- Edge compute (Cloudflare Workers)`,
  },
  {
    id: "be-consensus",
    cat: "Distributed Systems",
    n: "Consensus Algorithms (Paxos, Raft)",
    s: "How distributed systems agree on a value.",
    depth: "deep",
    level: "L3",
    detail: `## The Problem
Multiple nodes need to agree on a single value (leader election, shared log, config).

Must handle:
- Node crashes
- Network partitions
- Messages delayed/lost

## FLP Impossibility
In an async network, no deterministic algorithm can guarantee consensus if even one node can fail.

Real systems work around this:
- Assume partial synchrony (timeouts exist)
- Trade availability for consistency (CP)

## Paxos
Lamport's algorithm. Notoriously hard to understand + implement correctly.

Phases:
1. **Prepare** — proposer picks proposal number N, sends to acceptors
2. **Promise** — acceptors promise not to accept lower N
3. **Accept** — proposer sends value; acceptors accept if N is highest
4. **Learn** — value chosen when majority accept

Used in: Google Chubby, Spanner (evolution).

## Raft
Designed to be understandable. Same guarantees as Paxos.

![Raft States](https://raft.github.io/logo/annie-solo.png)

### States
- **Leader** — handles all writes
- **Follower** — passive, responds to leader
- **Candidate** — trying to become leader

### Leader Election
- Random election timeout (150-300ms)
- Follower becomes candidate if no heartbeat
- Candidate requests votes
- Majority → leader
- On split vote → new term, retry

### Log Replication
- Leader accepts write, appends to log
- Sends to followers (AppendEntries)
- Once majority acks → committed
- Followers apply to state machine

### Term
Monotonically increasing. Used to detect stale leaders.

Used in: etcd (Kubernetes), Consul, CockroachDB, TiDB, Nomad.

## ZAB (ZooKeeper Atomic Broadcast)
Similar spirit. Used in Apache ZooKeeper.

## Real-world Implications
- Writes need majority (quorum) — N/2+1 nodes alive
- 3 nodes tolerate 1 failure, 5 tolerate 2
- Odd numbers: no extra benefit from 4 vs 3

## Why It's Hard
- Network reordering
- Leader changes mid-op
- Recovering from crashes
- Byzantine faults (malicious/buggy nodes) need different algorithms (BFT, PBFT, blockchain)

## Practical Takeaways
- Don't implement consensus yourself — use etcd, Consul, ZooKeeper
- Understand quorum math for your use case
- Expect occasional leader elections during failures
- Use managed offerings (AWS RDS, Spanner, Aurora) unless you enjoy operating distributed databases

## Interview Prep
Know:
- Why 2PC isn't consensus (blocks on failure)
- Raft leader election flow
- Why odd number of nodes
- CAP — consensus sacrifices availability during partition
- CRDTs as alternative for some problems`,
  },
  {
    id: "be-event-sourcing",
    cat: "Microservices",
    n: "Event Sourcing & CQRS",
    s: "Store events not state; separate read and write models.",
    depth: "medium",
    level: "L3",
    detail: `## Event Sourcing
Instead of storing current state, store every state-changing event.

\`\`\`
Account events:
  - AccountOpened(id=1, owner=Alice)
  - MoneyDeposited(id=1, amount=100)
  - MoneyWithdrawn(id=1, amount=30)

Current state = sum of events = balance $70
\`\`\`

### Benefits
- **Full audit** — every change is a fact
- **Time travel** — reconstruct state at any point
- **Debug** — replay to reproduce bugs
- **Temporal queries** — "balance as of last month"
- **Multiple projections** — build different read models from same events

### Costs
- Complexity — rebuild from events is not trivial
- Schema evolution — events are immutable; how to handle changed fields?
- Query queries hard — need projections
- Storage — events accumulate (snapshotting mitigates)

## CQRS (Command Query Responsibility Segregation)
Separate **write** (command) and **read** (query) models.

\`\`\`
Command side: Write service → Event Store
                              ↓
Read side:    Projector consumes events → Denormalized Read DB → Query API
\`\`\`

### Benefits
- Read and write scaled independently
- Read models optimized per use case (search, dashboard, mobile)
- Write model focused on business rules

### Costs
- Eventual consistency between write and read
- More moving parts
- Developer overhead

## Together (Event Sourcing + CQRS)
Powerful combo. Events are source of truth; multiple projections.

\`\`\`
┌──────────┐  events   ┌──────────┐
│ Commands ├──────────►│  Event   │
└──────────┘           │   Log    │
                       └────┬─────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
       ┌────────┐      ┌────────┐      ┌────────┐
       │ Search │      │ Report │      │  API   │
       │ Index  │      │  DB    │      │ Cache  │
       └────────┘      └────────┘      └────────┘
\`\`\`

## When to Use
- Audit-heavy domains (banking, medical, legal)
- Complex business rules benefiting from replay
- Read/write pattern very different

## When NOT
- Simple CRUD
- Team new to it (steep learning curve)
- Don't need audit or time-travel

## Practical Implementation
- **Event store**: Kafka, EventStoreDB, Postgres
- **Snapshots** every N events to avoid replaying millions
- **Sagas** orchestrate multi-aggregate workflows
- **Versioning** events — add fields, never break

## Outbox Pattern (related)
Same idea but tactical: write event to DB + business data atomically. Poller publishes events.

## Real-world Examples
- Banking systems (natural fit)
- LMAX trading platform (6M orders/sec via event sourcing)
- Event sourcing is declining in popularity — CQRS alone is more common

## Interview Answer Template
"Event sourcing = store events, derive state. Good for audit, time-travel, replay. Paired with CQRS for scalable reads. Costs: complexity, eventual consistency, schema evolution."`,
  },
];
