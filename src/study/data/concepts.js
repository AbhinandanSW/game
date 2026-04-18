// Deep-dive concept explanations

export const CONCEPTS_COMMON = [
  {
    id: "c-xss",
    n: "XSS Prevention",
    cat: "Security",
    s: "Sanitize user input, use CSP headers, avoid innerHTML, escape output.",
    depth: "deep",
    detail: `## Cross-Site Scripting (XSS)

**Definition:** Attacker injects malicious client-side scripts into web pages viewed by others.

### Types
1. **Stored XSS** — Malicious script stored on server (e.g., in a comment), served to all users.
2. **Reflected XSS** — Script in URL/form input, reflected back in response. Attacker sends victim a crafted link.
3. **DOM-based XSS** — JavaScript modifies DOM with untrusted data (\`element.innerHTML = location.hash\`).

### Prevention (Frontend)
- **Escape output**: Use framework's auto-escaping (React: \`{value}\`, never \`dangerouslySetInnerHTML\` with user data)
- **Avoid \`innerHTML\`, \`document.write\`**; use \`textContent\`, \`createElement\`
- **Sanitize with DOMPurify** if you must render HTML: \`DOMPurify.sanitize(userHtml)\`
- **CSP (Content Security Policy)** header: \`Content-Security-Policy: script-src 'self'\` blocks inline scripts and external sources
- **Trusted Types API** (modern): enforces type-safe DOM sinks

### Prevention (Backend)
- Validate input (whitelist allowed chars)
- Encode output based on context (HTML, JS, URL, CSS) — different escaping rules
- Set \`X-XSS-Protection: 1; mode=block\` (legacy) + strong CSP
- \`HttpOnly\` cookies prevent JS access

### Example Attack
\`\`\`
// Victim visits: mysite.com/search?q=<script>stealCookie()</script>
// Server echoes q into HTML without escaping → script runs
\`\`\`

### Defense-in-Depth
1. Input validation
2. Output encoding
3. CSP
4. HttpOnly + SameSite cookies
5. Security reviews + linting rules (eslint-plugin-security)`,
  },
  {
    id: "c-csrf",
    n: "CSRF Prevention",
    cat: "Security",
    s: "Token-based validation, SameSite cookies, custom headers for API calls.",
    depth: "medium",
    detail: `## Cross-Site Request Forgery (CSRF)

**Definition:** Attacker tricks authenticated user into submitting a request to a trusted site (e.g., transfer money) without their knowledge.

### How it Works
1. User logs into bank.com (gets session cookie)
2. User visits evil.com which has: \`<form action="bank.com/transfer" method="POST"><input value="attacker">...</form>\` auto-submitted
3. Browser auto-sends bank.com cookies → server thinks it's legit

### Prevention
1. **CSRF Tokens** — Server embeds random token in form; validates on submit. Token must not be guessable.
2. **SameSite Cookies** — \`Set-Cookie: sessionId=...; SameSite=Lax\` (or Strict). Browser won't send cookies on cross-site requests.
3. **Custom Request Header** — e.g., \`X-Requested-With: XMLHttpRequest\`. Browsers block cross-site custom headers without CORS preflight.
4. **Double-Submit Cookie** — Cookie + matching value in header/body; attacker can't read cookie to replicate.
5. **Referer/Origin Header Check** — Server validates request came from same origin.

### Key Insight
CSRF exploits **implicit auth** (cookies). APIs using **Authorization headers** (Bearer tokens) are immune because browsers don't auto-attach them.`,
  },
  {
    id: "c-cors",
    n: "CORS",
    cat: "Security/Networking",
    s: "Browser security: cross-origin requests need server Access-Control-Allow-* headers.",
    depth: "medium",
    detail: `## CORS (Cross-Origin Resource Sharing)

**Same-Origin Policy** — Browsers restrict scripts from making requests to different origins (scheme + host + port).

**CORS** relaxes this via server-sent headers.

### Simple Requests
GET/POST with simple headers → browser sends with \`Origin\` header. Server responds with \`Access-Control-Allow-Origin: *\` or specific origin.

### Preflight (OPTIONS)
For "non-simple" requests (PUT, DELETE, custom headers, content-type JSON), browser first sends OPTIONS with:
- \`Access-Control-Request-Method\`
- \`Access-Control-Request-Headers\`

Server must respond with:
- \`Access-Control-Allow-Origin: https://app.example.com\`
- \`Access-Control-Allow-Methods: GET, POST, PUT, DELETE\`
- \`Access-Control-Allow-Headers: Content-Type, Authorization\`
- \`Access-Control-Max-Age: 86400\` (cache preflight)

### Credentials
\`\`\`
// Client
fetch(url, { credentials: 'include' })

// Server (can't use * with credentials)
Access-Control-Allow-Origin: https://specific-origin.com
Access-Control-Allow-Credentials: true
\`\`\`

### Common Mistakes
- Using wildcard \`*\` with credentials (not allowed)
- Forgetting OPTIONS handler for preflight
- Cache issues with shared CDN (Vary: Origin header)`,
  },
];

export const CONCEPTS_FE = [
  {
    id: "fe-event-loop",
    cat: "JavaScript",
    n: "Event Loop",
    s: "Single-threaded runtime using call stack + task queues for async execution.",
    depth: "deep",
    detail: `## The JavaScript Event Loop

JavaScript is **single-threaded** but handles async operations through the event loop coordinating:
- **Call Stack** — Where function frames are pushed/popped
- **Web APIs** — setTimeout, fetch, DOM events (run in browser, not JS)
- **Callback/Task Queue** — Callbacks wait to run on the stack
- **Microtask Queue** — Promise callbacks, queueMicrotask, MutationObserver

### Execution Order
1. Run synchronous code (call stack)
2. After stack empties, drain ALL microtasks
3. Run ONE macrotask
4. Drain microtasks again
5. Render (if browser)
6. Repeat

### Example
\`\`\`js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');

// Output: 1, 4, 3, 2
// Why: 1 & 4 are sync. 3 is microtask (drained before macrotask 2).
\`\`\`

### Microtasks vs Macrotasks
- **Microtasks**: Promise.then, queueMicrotask, MutationObserver. Highest priority.
- **Macrotasks**: setTimeout, setInterval, I/O, UI events. One per loop iteration.

### Common Pitfalls
- **Blocking the loop** with long-running sync code (for loops, large JSON parse) → UI freezes
- **Infinite microtask** → macrotask starvation (\`Promise.resolve().then(loop)\`)
- **setTimeout(fn, 0)** isn't truly 0ms — minimum 4ms clamped

### Node.js Differences
Phases: timers → pending callbacks → idle → poll → check (setImmediate) → close. Microtasks drained between each phase.

### Rendering
Browser tries to render at 60fps (every 16.67ms). Long-running JS blocks this. Use \`requestAnimationFrame\` for animations to sync with render cycle.`,
  },
  {
    id: "fe-closures",
    cat: "JavaScript",
    n: "Closures",
    s: "Function retaining access to its lexical scope even after outer fn returns.",
    depth: "deep",
    detail: `## Closures

A closure is a function bundled with its lexical environment (the variables accessible when it was defined).

### Simple Example
\`\`\`js
function makeCounter() {
  let count = 0;
  return {
    increment: () => ++count,
    get: () => count,
  };
}

const c = makeCounter();
c.increment(); // 1
c.increment(); // 2
// count is private — only accessible via the returned functions
\`\`\`

### Use Cases
1. **Data privacy** — module pattern, private state
2. **Memoization** — cache results inside closure
3. **Partial application** — currying, bind
4. **Callbacks** — remember context (setTimeout, event handlers)
5. **Iterators** — generators / state machines

### Classic Interview Question
\`\`\`js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3 (all share same i)

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2 (each iteration creates new binding)
\`\`\`

### Memory Implications
Closures retain references — large objects referenced by a closure are NOT garbage collected until the closure is released. Common leak source.

### Lexical Scope
Determined at **definition time**, not call time:
\`\`\`js
let x = 1;
function outer() {
  let x = 2;
  return inner;
}
function inner() { console.log(x); } // prints 1 (defined in global scope)
\`\`\``,
  },
  {
    id: "fe-proto",
    cat: "JavaScript",
    n: "Prototypal Inheritance",
    s: "Objects inherit directly from other objects via __proto__ chain.",
    depth: "deep",
    detail: `## Prototypal Inheritance

Unlike classical OOP (classes inherit from classes), JS uses **prototype chains** — objects inherit from other objects.

### The Prototype Chain
Every object has \`[[Prototype]]\` (accessible via \`__proto__\` or \`Object.getPrototypeOf\`) pointing to another object. Property lookup walks this chain until found or null.

\`\`\`js
const animal = { eats: true };
const rabbit = { jumps: true };
Object.setPrototypeOf(rabbit, animal);

rabbit.jumps; // true (own)
rabbit.eats;  // true (inherited via chain)
\`\`\`

### \`prototype\` vs \`__proto__\`
- \`Constructor.prototype\` — object assigned as \`__proto__\` of instances created with \`new Constructor()\`
- \`instance.__proto__\` — the prototype this instance was created from

\`\`\`js
function Person(name) { this.name = name; }
Person.prototype.greet = function() { return 'Hi ' + this.name; };

const p = new Person('Alex');
p.__proto__ === Person.prototype; // true
p.greet(); // walks up chain to find greet
\`\`\`

### ES6 Classes (syntactic sugar)
\`\`\`js
class Animal {
  constructor(name) { this.name = name; }
  eat() { return this.name + ' eats'; }
}
class Dog extends Animal {
  bark() { return 'woof'; }
}
// Same prototype chain under the hood:
// dog.__proto__ === Dog.prototype → Animal.prototype → Object.prototype → null
\`\`\`

### Key Insight
- Methods live on prototypes (shared) — memory efficient
- Properties live on instances (per-object)
- \`hasOwnProperty()\` checks own vs inherited`,
  },
  {
    id: "fe-this",
    cat: "JavaScript",
    n: "this Keyword",
    s: "Determined by call-site: default, implicit, explicit, new binding + arrow fn.",
    depth: "deep",
    detail: `## The \`this\` Keyword

\`this\` is determined by **how a function is called**, not where it's defined.

### The 4+1 Rules (in priority order)
1. **new binding** — \`new Foo()\` → \`this\` = newly created object
2. **Explicit binding** — \`fn.call(obj)\`, \`fn.apply(obj, args)\`, \`fn.bind(obj)\` → \`this\` = obj
3. **Implicit binding** — \`obj.method()\` → \`this\` = obj
4. **Default binding** — bare \`fn()\` → \`this\` = globalThis (or undefined in strict)
5. **Arrow functions** — don't have their own \`this\`; lexical \`this\` (inherits from enclosing scope)

### Examples
\`\`\`js
const obj = {
  name: 'A',
  greet() { return this.name; },
};
obj.greet();                  // 'A' (implicit)
const g = obj.greet;
g();                          // undefined / error (default)
g.call(obj);                  // 'A' (explicit)
const arrow = () => this;     // inherits from module/global
\`\`\`

### Common Pitfalls
- Losing \`this\` when passing methods as callbacks: \`setTimeout(obj.method)\` loses binding
- Fix: \`setTimeout(() => obj.method())\` or \`obj.method.bind(obj)\`
- Arrow functions in class methods: \`arrow\` captures class instance's \`this\` — good for callbacks

### Strict Mode
\`this\` is \`undefined\` in default binding (not \`globalThis\`).`,
  },
  {
    id: "fe-vdom",
    cat: "React",
    n: "Virtual DOM & Reconciliation",
    s: "In-memory DOM tree; diffing algorithm minimizes real DOM mutations.",
    depth: "deep",
    detail: `## Virtual DOM & Reconciliation

### Why Virtual DOM?
Real DOM operations are expensive (re-layout, re-paint). React keeps an **in-memory tree (Virtual DOM)** and diffs it against the previous tree. Only changed nodes are applied to the real DOM.

### The Algorithm (Heuristics)
React's reconciliation uses **O(n)** heuristics (classical diff is O(n³)):

1. **Different root types** → full rebuild (\`<div>\` to \`<span>\` discards entire subtree)
2. **Same type** → compare props, update attributes; recurse on children
3. **Keys on lists** — match elements by key across renders (crucial for reorder)

### Fiber Architecture (React 16+)
- Work split into units (fibers)
- Interruptible — can pause, resume, prioritize
- Two phases:
  1. **Render phase** (can be paused): build new fiber tree, diff
  2. **Commit phase** (synchronous): apply changes to DOM

### Keys
Bad:
\`\`\`jsx
{items.map((item, i) => <Item key={i} />)}  // index-based — breaks on reorder
\`\`\`
Good:
\`\`\`jsx
{items.map(item => <Item key={item.id} />)}  // stable identity
\`\`\`

### What Triggers Re-render
- State change (\`setState\`, \`useState\`)
- Parent re-rendered (unless memoized)
- Context value change (re-renders all consumers)

### Avoiding Unnecessary Renders
- \`React.memo\` — skip re-render if props unchanged (shallow)
- \`useMemo\` — memoize expensive computation
- \`useCallback\` — stable function reference across renders`,
  },
];

export const CONCEPTS_BE = [
  {
    id: "be-acid",
    cat: "Databases",
    n: "Transactions & Isolation Levels",
    s: "ACID, Read Committed, Repeatable Read, Serializable, Phantom reads, MVCC.",
    depth: "deep",
    detail: `## Database Transactions & Isolation

### ACID
- **Atomicity** — All-or-nothing (commit or rollback all ops)
- **Consistency** — Valid state transitions (constraints enforced)
- **Isolation** — Concurrent txns don't interfere
- **Durability** — Committed data survives crashes (WAL, fsync)

### Phenomena
- **Dirty Read** — Read uncommitted data
- **Non-repeatable Read** — Same row read twice gives different results
- **Phantom Read** — Same query returns different row sets (INSERT happened)
- **Lost Update** — Two writers overwrite each other

### Isolation Levels (SQL Standard)
| Level | Dirty | Non-repeatable | Phantom |
|-------|-------|----------------|---------|
| Read Uncommitted | ✓ | ✓ | ✓ |
| Read Committed | ✗ | ✓ | ✓ |
| Repeatable Read | ✗ | ✗ | ✓ |
| Serializable | ✗ | ✗ | ✗ |

### MVCC (Multi-Version Concurrency Control)
- Each write creates new version, readers see snapshot at txn start
- Postgres, MySQL InnoDB use MVCC → readers don't block writers
- Trade-off: more storage for versions + vacuum/cleanup

### Serializable Implementations
- **Lock-based (2PL)** — Acquire locks, release at commit
- **Optimistic (SSI)** — Postgres: detect conflicts at commit time, abort one

### Real-world Advice
- Default: Read Committed (Postgres default)
- Repeatable Read for financial reports
- Serializable sparingly (high abort rate under contention)`,
  },
  {
    id: "be-cap",
    cat: "Databases",
    n: "CAP Theorem",
    s: "In network partition, choose Consistency or Availability.",
    depth: "deep",
    detail: `## CAP Theorem

In any distributed system, during a **network partition (P)**, you can have **either Consistency (C) or Availability (A), not both**.

- **Consistency** — All nodes see same data at same time (linearizability)
- **Availability** — Every request gets a response (maybe stale)
- **Partition Tolerance** — System continues despite network failures

In practice, partitions happen, so you design for **CP** or **AP**.

### CP Systems (favor consistency)
- RDBMS (Postgres, MySQL with strong consistency)
- HBase, MongoDB (w=majority)
- ZooKeeper, etcd
- Block writes during partition to avoid split-brain

### AP Systems (favor availability)
- Cassandra, DynamoDB (tunable)
- Riak, CouchDB
- Accept writes on both sides of partition → resolve conflicts later (last-write-wins, CRDTs, vector clocks)

### PACELC Extension
**If** P: choose A or C
**Else** (no partition): choose Latency (L) or Consistency (C)

Example: DynamoDB is PA/EL — favors availability during partition, low latency otherwise.

### Consistency Models Spectrum
Strong ← Linearizable ← Sequential ← Causal ← Read-your-writes ← Eventual → Weak

### Practical Design
- Use strong consistency for: payments, inventory, auth
- Use eventual for: social feeds, view counts, likes
- Read replicas often lag — can serve stale reads for non-critical paths`,
  },
  {
    id: "be-sharding",
    cat: "Databases",
    n: "Sharding & Partitioning",
    s: "Horizontal vs Vertical, Hash-based vs Range-based, Consistent hashing.",
    depth: "deep",
    detail: `## Sharding (Horizontal Partitioning)

Split data across multiple nodes to scale writes + storage.

### Sharding Strategies
1. **Range-based** — \`user_id 0-1M → shard1, 1M-2M → shard2\`
   - Pros: Range queries efficient
   - Cons: Hotspots (auto-increment IDs cluster)

2. **Hash-based** — \`shard = hash(key) % N\`
   - Pros: Even distribution
   - Cons: Resharding is painful (remap all keys)

3. **Consistent Hashing** — Map keys + nodes onto ring, walk clockwise
   - Pros: Adding/removing a node only remaps 1/N of keys
   - Pros: Virtual nodes smooth distribution
   - Used in: Cassandra, DynamoDB, Memcached

4. **Directory-based** — Lookup service maps key → shard
   - Pros: Flexible migration
   - Cons: Lookup SPOF

### Resharding Challenges
- Data movement during rebalance
- Double-writes during cutover
- Online vs offline migration

### Hotspots
- Bad choice: sharding by timestamp → all writes to one shard
- Fix: add entropy (hash prefix) or use composite key

### Cross-Shard Queries
- Scatter-gather (query all shards, merge)
- Global secondary indexes
- Denormalize for common queries

### Replication + Sharding
Each shard has replicas for HA. Cross-shard transactions need 2PC or sagas.`,
  },
  {
    id: "be-cache-strategies",
    cat: "Caching",
    n: "Caching Strategies",
    s: "Cache-aside, Read-through, Write-through, Write-behind, Refresh-ahead.",
    depth: "deep",
    detail: `## Caching Strategies

### 1. Cache-Aside (Lazy Loading) — most common
\`\`\`
1. Read from cache → if miss, read from DB
2. Write to cache
3. Return value
\`\`\`
Pros: Cache only what's needed | Cons: First request is slow (cold cache), stale data

### 2. Read-Through
Cache loads from DB on miss automatically. App only talks to cache.
- Used in Redis with modules, DynamoDB DAX

### 3. Write-Through
Every write goes to cache + DB synchronously.
- Pros: Cache always fresh | Cons: Higher write latency

### 4. Write-Behind (Write-Back)
Write to cache first, async flush to DB.
- Pros: Fast writes, batches DB updates | Cons: Data loss if cache fails before flush

### 5. Write-Around
Writes go directly to DB, skip cache. Subsequent reads populate cache.
- Good when data written rarely read

### 6. Refresh-Ahead
Pre-refresh cache before expiry based on access patterns.
- Prevents cache miss on hot keys | Risk: wasted refreshes

### Cache Invalidation
- **TTL** — time-based
- **Event-based** — invalidate on DB change
- **Version tags** — bump version to invalidate all keys matching prefix

### Cache Stampede
Many requests hit DB when a hot key expires.
- **Single-flight** — first request populates, others wait
- **Probabilistic early refresh** — refresh before expiry with small probability
- **Lock/mutex** on cache miss

### Eviction Policies
- **LRU** — Least Recently Used
- **LFU** — Least Frequently Used
- **FIFO** — oldest first
- **ARC** — Adaptive (hot + recent combo)`,
  },
  {
    id: "be-kafka",
    cat: "Messaging",
    n: "Kafka Architecture",
    s: "Broker, Topic, Partition, Consumer Group, Offset, Exactly-once.",
    depth: "deep",
    detail: `## Apache Kafka

A **distributed log** — append-only, replicated, partitioned.

### Core Concepts
- **Broker** — Kafka server; a cluster has multiple brokers
- **Topic** — logical feed name (e.g., "orders")
- **Partition** — ordered, immutable sequence; unit of parallelism
- **Replica** — each partition replicated across brokers (leader + followers)
- **Producer** — writes to topic; chooses partition (key hash or round-robin)
- **Consumer** — reads from topics, tracks **offset** per partition
- **Consumer Group** — multiple consumers share workload; each partition consumed by one consumer in group
- **ISR** — In-Sync Replicas, ack from leader + synced followers

### Ordering
Ordered within a partition, NOT across partitions. Same key → same partition → ordered.

### Delivery Semantics
- **At-most-once** — fire and forget
- **At-least-once** — retry until ack (duplicates possible)
- **Exactly-once** — idempotent producer + transactions (EOS mode)

### Why Fast?
- Sequential disk writes (faster than random)
- Page cache (zero-copy: \`sendfile()\`)
- Batching + compression

### vs RabbitMQ
- Kafka: log (replay, many consumers), high throughput
- RabbitMQ: queue (delete on ack), richer routing, lower throughput

### Partitioning Strategy
- More partitions = more parallelism but more overhead
- Rule of thumb: 10× max consumer instances

### Common Patterns
- **Event Sourcing** — store every state change
- **CQRS** — commands write to Kafka, reads from materialized views
- **Stream Processing** — Kafka Streams, Flink consume + transform + produce`,
  },
  {
    id: "be-microservices",
    cat: "Microservices",
    n: "Distributed Transactions",
    s: "2PC, 3PC, Saga (Choreography vs Orchestration), Outbox.",
    depth: "deep",
    detail: `## Distributed Transactions

In microservices, a business operation spans multiple services/DBs. You can't use a single DB transaction.

### Two-Phase Commit (2PC)
1. **Prepare** — Coordinator asks each participant: "can you commit?"
2. **Commit** — If all yes, coordinator says commit; else abort

Pros: Strong consistency | Cons: Blocking, SPOF coordinator, poor availability

### Saga Pattern (recommended)
Sequence of local transactions with **compensating actions** on failure.

**Choreography** — Services publish events, react to each other. No central coordinator.
\`\`\`
Order.Created → Payment.Charged → Shipping.Requested → Inventory.Reserved
\`\`\`
If Inventory fails → Compensation events fire backward (Refund, Unship, etc.)

**Orchestration** — Central orchestrator tells each service what to do.
\`\`\`
Orchestrator:
  1. call Payment.charge()
  2. call Inventory.reserve() — fails
  3. call Payment.refund() (compensation)
\`\`\`

### Outbox Pattern
Reliable event publishing:
1. Service writes both data + event to same DB atomically
2. Separate process polls outbox table, publishes to Kafka
3. Marks event as sent

Solves "dual write" problem (can't atomically write to DB + send Kafka msg).

### Idempotency
Every operation must be safe to retry. Use **idempotency keys** (UUID per request).

### Eventual Consistency
Accept that state converges over time. Design UX to handle "in progress" states (e.g., "Order placed, payment processing").`,
  },
  {
    id: "be-jwt",
    cat: "Security",
    n: "Authentication: JWT vs Sessions",
    s: "JWT, OAuth 2.0 flows, OIDC, RBAC, ABAC, Token refresh, PKCE.",
    depth: "deep",
    detail: `## Authentication & Authorization

### Session-based Auth
1. User logs in → server creates session, stores in DB/Redis, returns session ID cookie
2. Subsequent requests include cookie → server validates
- Pros: Revocable, simple
- Cons: Server must maintain state (doesn't scale as easily)

### JWT (JSON Web Token)
Stateless token: \`header.payload.signature\` (base64-encoded)
1. Login → server signs JWT with secret, returns to client
2. Client sends in \`Authorization: Bearer <token>\` header
3. Server validates signature (no DB lookup)
- Pros: Stateless, self-contained
- Cons: Can't revoke before expiry, larger than session ID

### JWT Structure
\`\`\`
{
  "sub": "user123",
  "exp": 1609459200,
  "roles": ["admin"]
}
\`\`\`
Signed with HMAC-SHA256 (symmetric) or RSA (asymmetric).

### OAuth 2.0 Flows
- **Authorization Code (+ PKCE)** — Web/mobile apps. User redirected to provider, returns code, exchanged for token.
- **Client Credentials** — Service-to-service. No user involved.
- **Implicit** — Deprecated. Token in URL fragment.
- **Password** — Legacy. User enters credentials to app.

### PKCE (Proof Key for Code Exchange)
Prevents code interception attacks on mobile. Client generates code_verifier + code_challenge.

### OIDC (OpenID Connect)
Identity layer on top of OAuth 2.0. Adds ID token (JWT with user identity claims).

### RBAC vs ABAC
- **RBAC** — Role-Based (user has role → role has permissions)
- **ABAC** — Attribute-Based (policies like "allow if user.dept == resource.dept")

### Best Practices
- Short-lived access token (15min) + refresh token (days)
- Rotate refresh tokens
- Use HttpOnly + Secure + SameSite cookies
- Never store JWTs in localStorage (XSS risk)`,
  },
];
