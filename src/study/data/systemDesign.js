// System design problems with detailed prompts and sample solutions

export const SYSTEM_DESIGN = [
  {
    id: "sd-chat",
    title: "Chat Application (WhatsApp)",
    track: "both",
    scale: "2B users, 100B messages/day, 1KB/msg",
    prompt: "Design a real-time chat application like WhatsApp supporting 1-on-1 messaging, group chats (up to 256 members), message delivery guarantees, and offline message queueing.",
    requirements: [
      "Functional: 1-on-1 chat, group chat, media (images, videos, documents), read receipts, typing indicators, online presence, last seen, push notifications",
      "Non-functional: Low latency (<200ms), High availability (99.99%), End-to-end encryption, Durability (no message loss)",
    ],
    scope: [
      "How do you estimate scale? 2B users × 50 msgs/day × 1KB = 100TB/day.",
      "Read-to-write ratio? Roughly 1:1 for chats (each message read ~once).",
      "Number of active connections? ~500M concurrent users.",
    ],
    approach: `**High-Level Architecture:**
1. **Clients** (mobile/web) → WebSocket connection → **Chat Server** (stateful)
2. **Load Balancer** with sticky sessions (or Layer-7 routing by userId hash)
3. **Message Queue** (Kafka) decouples producers from consumers
4. **Storage**: Cassandra/HBase for messages (wide-column, high write throughput), Redis for presence/session data
5. **Media Service** uploads to S3, stores only URL in message DB
6. **Push Notification Service** for offline users (FCM/APNs)

**Message Flow:**
1. User A sends message → WebSocket → Chat Server
2. Server persists message to Cassandra (partition by chatId, sort by timestamp)
3. Publishes event to Kafka (topic per chat or sharded by userId)
4. If User B is online on another Chat Server, server consumes event and pushes via WebSocket
5. If offline, Push Notification Service sends FCM/APNs

**Key Challenges:**
- **Ordering**: Use timestamps + logical clocks (Lamport) per chat
- **Delivery guarantees**: At-least-once with idempotency via messageId
- **Group fanout**: For large groups, fanout at read-time (pull) to avoid write amplification
- **E2E encryption**: Signal protocol (double ratchet). Server sees ciphertext only
- **Presence**: Redis with TTL heartbeat (30s), published via Pub/Sub

**Database Schema:**
- messages: (chatId, timestamp, messageId, senderId, type, content, status)
- Partition by chatId, clustering by timestamp DESC

**Optimizations:**
- Read from cache first (last 100 messages per chat in Redis)
- Compress older messages to cold storage
- CDN for media delivery
- Connection pooling, keepalive for WebSockets`,
    components: "Chat Server (WebSocket), Message Queue (Kafka), DB (Cassandra), Presence Service (Redis), Media Service (S3+CDN), Push Notifications (FCM/APNs)",
    tradeoffs: [
      "**Fanout on write vs read**: Write fanout has higher write load but lower read latency. For large groups, read fanout is better.",
      "**Consistency vs Availability**: Chose AP (Cassandra) — tolerate brief inconsistency over unavailability.",
      "**Stateful WebSocket vs polling**: WebSocket saves bandwidth but complicates load balancing.",
    ],
  },
  {
    id: "sd-feed",
    title: "Twitter / Social Feed",
    track: "both",
    scale: "500M users, 200M DAU, 400M tweets/day, 1.5PB media/day",
    prompt: "Design a social media feed like Twitter/X with timeline generation, real-time updates, and media support. Handle celebrity accounts (millions of followers).",
    requirements: [
      "Functional: Post tweet, follow/unfollow, timeline (home + profile), likes, retweets, replies, media upload, search",
      "Non-functional: Timeline load <500ms, Infinite scroll, Near-real-time updates, Trending topics",
    ],
    scope: [
      "Feed generation for 200M DAU with 1000+ following avg",
      "Celebrity problem: 100M followers → 100M writes per tweet if fan-out on write",
    ],
    approach: `**Hybrid Fan-out Strategy:**
- For users with <1M followers: Fan-out on write (push tweet to follower timelines)
- For celebrities: Fan-out on read (pull latest tweets when user loads feed)
- Merge both streams when constructing timeline

**Architecture:**
1. **Tweet Service** → Kafka → **Fanout Service** → Redis (timeline cache) per user
2. **User Service** stores follow graph in sharded MySQL/Cassandra
3. **Timeline Service** merges cached timeline + recent celebrity tweets at read time
4. **Media Pipeline**: Upload → S3 → Transcoding → CDN
5. **Search** uses Elasticsearch with async indexing

**Timeline Cache:**
- Redis sorted set per user: ZADD timeline:userId tweetId SCORE timestamp
- TTL: 7 days or last 800 tweets
- Regenerate for inactive users on login

**Data Model:**
- tweets: (tweetId PK, userId, content, timestamp, mediaUrls, replyTo)
- follows: (followerId, followeeId, createdAt) — sharded by followerId
- Denormalize counts (likes, retweets) with periodic rebuild

**Scaling:**
- Sharding by userId (consistent hashing)
- Read replicas for tweet DB
- CDN for media
- Kafka partitioning by userId`,
    components: "Tweet Service, Timeline Service, Fanout Service, User Graph, Redis (timeline cache), Search (ES), Media pipeline, CDN",
    tradeoffs: [
      "**Hybrid fanout vs pure push/pull**: Balances write load and read latency",
      "**Eventual consistency**: Accept brief delay in timeline vs blocking writes",
      "**Denormalized counts**: Fast reads vs periodic reconciliation jobs",
    ],
  },
  {
    id: "sd-ecommerce",
    title: "E-commerce Product Page (Flipkart/Amazon)",
    track: "both",
    scale: "100M products, 10M orders/day, Black Friday 10x spike",
    prompt: "Design an e-commerce product detail page service. Handle product info, variants, inventory, reviews, recommendations, pricing, add-to-cart.",
    requirements: [
      "Functional: Product catalog, variant selection, reviews/ratings, inventory check, add to cart, recommendations, search integration",
      "Non-functional: <500ms page load, Handle 10x spike, 99.95% uptime, SEO-friendly",
    ],
    scope: ["Read-heavy (100:1 read/write)", "Strong consistency for inventory, eventual for counts"],
    approach: `**Microservices:**
- Product Service (catalog, variants, specs)
- Inventory Service (real-time stock per warehouse)
- Pricing Service (dynamic pricing, promotions)
- Review Service (ratings, reviews, sentiment)
- Recommendation Service (collaborative filtering, ML)
- Cart Service (user carts with TTL)
- Order Service (order lifecycle)
- Search Service (Elasticsearch)

**Data Strategies:**
- Product catalog: MongoDB (document store for nested attributes)
- Inventory: Redis with atomic decrements + MySQL as source of truth
- Reviews: Cassandra (high write throughput, partitioned by productId)
- Cart: Redis with 30-day TTL

**Caching:**
- Edge CDN (Cloudflare) for static product pages
- Application cache (Redis) for hot products (L2)
- Browser cache for images (long TTL, versioned URLs)

**Consistency Patterns:**
- Inventory: Optimistic locking or distributed locks (Redlock)
- Order: Saga pattern (inventory → payment → shipping)
- Reviews: Eventually consistent, async indexing

**Black Friday Handling:**
- Pre-warmed cache, auto-scaling, queue-based order processing
- Read replicas for product DB
- Rate limiting per user`,
    components: "Product Service, Inventory, Cart, Order, Payment, Search (ES), Recommendation, Review, CDN, Redis",
    tradeoffs: ["Availability over strong consistency for reviews", "Strong consistency for inventory via distributed locks"],
  },
  {
    id: "sd-url-shortener",
    title: "URL Shortener (TinyURL / bit.ly)",
    track: "be",
    scale: "100M URLs/month, 10:1 read/write, 60TB/5yr",
    prompt: "Design a URL shortening service. Users input a long URL and get a short URL (e.g., tinyurl.com/abc123). Support custom aliases, analytics, expiration.",
    requirements: [
      "Functional: Shorten URL, redirect, custom alias, analytics (clicks, geo), expiration",
      "Non-functional: <100ms redirect, 100:1 read:write, Uniqueness guaranteed",
    ],
    scope: ["100M URLs/month → 1.2B URLs/year, 6B/5yr", "Storage: 500B/URL × 6B = 3TB, with metadata = ~60TB"],
    approach: `**Short Code Generation:**
Option 1: **Base62 encoding of auto-increment ID** (a-z, A-Z, 0-9 → 62 chars)
- 7 chars = 62^7 = 3.5T combinations
- Pros: Sequential, predictable | Cons: Enumerable, reveals counts
Option 2: **Hash long URL (MD5/SHA)**, take first 7 chars
- Collision: check DB, retry with salt
Option 3: **Pre-generated pool** of unique codes in a separate service

**Architecture:**
1. **Write path**: Client → App Server → Key Generation Service → DB (NoSQL)
2. **Read path**: Client → CDN (if hot) → App Server → Cache (Redis) → DB
3. Analytics events → Kafka → ClickHouse/BigQuery for aggregation

**Database Choice:**
- NoSQL (DynamoDB/Cassandra) for URL table — KV access pattern fits
- Schema: (shortCode PK, longUrl, userId, createdAt, expiresAt, hits)

**Caching:**
- LRU cache (Redis) for hot URLs, 80% of traffic from 20% of URLs
- CDN for very popular redirects (returns 301 cached at edge)

**Analytics Pipeline:**
- Redirect emits event → Kafka → Aggregator → Time-series DB
- Dashboard queries aggregated data, not raw events

**Scaling:**
- Horizontal shard by shortCode hash
- Read replicas for hot partitions
- Multi-region deployment with geo-DNS`,
    components: "App Server, Key Generation Service, Cache (Redis), DB (Cassandra), CDN, Analytics Pipeline (Kafka + ClickHouse)",
    tradeoffs: ["Base62 counter: simple but enumerable", "Hash-based: unpredictable but collisions need handling"],
  },
  {
    id: "sd-rate-limiter",
    title: "Rate Limiter",
    track: "be",
    scale: "1M requests/sec, Per-user + per-API limits, <1ms overhead",
    prompt: "Design a distributed rate limiter that enforces API quotas (e.g., 100 requests per minute per user). Support per-user, per-IP, and per-endpoint limits.",
    requirements: [
      "Functional: Configurable limits, per-user/IP/endpoint, multiple strategies",
      "Non-functional: <1ms overhead, Distributed (shared across servers), Fail-open on errors",
    ],
    scope: ["API gateway serves 1M req/sec", "Rate limit check must not bottleneck requests"],
    approach: `**Algorithms:**
1. **Token Bucket**: Refill rate N tokens/sec, bucket size K. Take 1 token per req.
   - Pros: Handles bursts | Cons: Tracks bucket state
2. **Leaky Bucket**: Fixed outflow rate, queue excess
3. **Fixed Window Counter**: Count requests per time window (e.g., per minute)
   - Cons: Burst at window boundary (2x limit in 1 second)
4. **Sliding Window Log**: Store timestamps of requests, count in window
   - Pros: Accurate | Cons: Memory-heavy
5. **Sliding Window Counter**: Weighted avg of current + previous window

**Distributed Implementation:**
- **Redis** as shared counter store (atomic INCR with TTL)
- Use Lua scripts for atomic check-and-increment
- Key format: rate_limit:{userId}:{endpoint}:{window}

**Example (Fixed Window in Redis):**
\`\`\`
-- Lua script (atomic)
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return current > tonumber(ARGV[2]) and 0 or 1
\`\`\`

**Architecture:**
- API Gateway → Rate Limiter middleware → Redis
- Config service for limit rules (per-user, tier-based)
- Circuit breaker: if Redis down, fail open (allow all) for availability

**Handling High Throughput:**
- Redis cluster with consistent hashing by userId
- Local in-memory counters synced periodically (approximate but fast)
- Hybrid: local bucket + Redis reconciliation every 100ms

**Response:**
- 429 Too Many Requests
- Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset`,
    components: "API Gateway, Rate Limiter middleware, Redis cluster, Config service, Monitoring",
    tradeoffs: ["Accuracy (sliding log) vs memory (fixed window)", "Strong distributed consistency vs local approximation"],
  },
  {
    id: "sd-dashboard",
    title: "Analytics Dashboard (Frontend)",
    track: "fe",
    prompt: "Design a real-time analytics dashboard with multiple charts, filters, and drill-downs. Support 100+ widgets, configurable layouts, and live data.",
    requirements: [
      "Functional: Chart widgets (line, bar, pie, table), filters (date range, segments), drill-down, export, dashboard save/share",
      "Non-functional: Initial load <2s, Smooth interactions, Handle 100+ widgets without lag, Mobile responsive",
    ],
    approach: `**Component Architecture:**
- DashboardGrid (react-grid-layout for drag/resize)
- ChartWidget (wraps ECharts/Recharts)
- FilterPanel (shared filter state)
- DateRangePicker
- WidgetConfigModal

**State Management:**
- Dashboard layout: Zustand store, persisted to localStorage + backend
- Widget data: React Query with staleTime=30s, background refetch
- Filters: URL params (shareable links)

**Performance:**
- Virtualize off-screen widgets (react-virtual)
- Code-split chart library (~200KB lazy)
- Debounce filter changes (500ms)
- Request coalescing: merge same-endpoint calls within 50ms window
- Web workers for heavy CSV parsing / data transforms

**Real-time Updates:**
- SSE for push updates on widgets subscribed to live data
- WebSocket only if bidirectional needed

**Caching:**
- React Query for server cache
- IndexedDB for recently viewed reports (offline support)

**Accessibility:**
- Chart tables as fallback (screen reader)
- Keyboard navigation for grid
- ARIA live regions for updates`,
    components: "DashboardGrid, ChartWidget, FilterPanel, DataFetcher (React Query), Layout persistence",
  },
  {
    id: "sd-autocomplete",
    title: "Autocomplete / Typeahead Search (Frontend)",
    track: "fe",
    prompt: "Build a search autocomplete component used by millions. Show top suggestions as user types, handle keyboard nav, highlight matches, cache results.",
    requirements: ["Functional: Suggestions on input, keyboard nav, match highlighting, recent searches, categories", "Non-functional: <100ms perceived latency, Debounced, Accessible"],
    approach: `**Client-side Architecture:**
- **Debounce** input (200-300ms) to reduce API calls
- **AbortController** to cancel in-flight requests when query changes
- **Cache** results in Map keyed by query for instant re-display
- **Prefix-trie** fallback for offline/recent searches

**API Contract:**
- GET /suggest?q=iph — returns [{ text, category, meta }]
- Response within 100ms ideally

**Keyboard:**
- ↑/↓ — navigate suggestions
- Enter — select
- Esc — close
- Tab — auto-complete with top suggestion

**Accessibility:**
- role="combobox" with aria-expanded, aria-activedescendant
- Announce suggestion count via aria-live
- Focus trap while dropdown open

**Performance:**
- Render only top 10 suggestions
- Highlight matches with <mark>
- Lazy-load suggestion details on hover

**Edge Cases:**
- Empty query → show recent/popular searches
- No results → friendly empty state
- Network error → show cached results with warning`,
    components: "SearchInput, SuggestionList, KeyboardNav, useDebounce, useCache",
  },
  {
    id: "sd-docs",
    title: "Collaborative Editor (Google Docs)",
    track: "both",
    scale: "100M docs, 10M concurrent editors, <100ms sync latency",
    prompt: "Design a collaborative document editor with real-time multi-user editing, cursor presence, conflict resolution, and version history.",
    requirements: ["Real-time collaboration", "Conflict-free concurrent edits", "Presence (cursors)", "Version history", "Offline support"],
    approach: `**Core Algorithms:**
- **Operational Transformation (OT)** — Google Docs approach. Server serializes ops, transforms based on concurrent ops.
- **CRDT (Conflict-free Replicated Data Type)** — Modern approach (Yjs, Automerge). No server needed for merging.

**Architecture:**
1. Client edits → generates op → sends to server via WebSocket
2. Server receives op, transforms against concurrent ops, broadcasts to other clients
3. Each client applies transformed op to local state
4. Snapshot + op log for version history

**Components:**
- Editor (rich text like ProseMirror)
- Collaboration engine (OT/CRDT)
- Presence service (cursor positions via Redis pub/sub)
- Document service (stores snapshots + op log)
- ACL service (permissions: view/comment/edit)

**Data Storage:**
- Document snapshots: S3 or object store (every 100 ops)
- Op log: append-only, time-indexed (Kafka or log-structured store)
- Presence: Redis with TTL

**Challenges:**
- Convergence: All clients reach same state regardless of op order
- Intent preservation: "bold this word" shouldn't break if word shifts
- Scalability: Partition by docId; each doc handled by one coordinator

**Offline:**
- Buffer ops locally
- Replay on reconnect with OT/CRDT merge`,
    components: "Editor, Collab Engine (OT/CRDT), Presence (Redis), Doc Storage (S3 + Log), ACL, WebSocket server",
    tradeoffs: ["OT: Simpler ops, needs central server. CRDT: P2P-capable, more memory"],
  },
];
