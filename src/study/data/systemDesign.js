// System design problems with detailed prompts and sample solutions

export const SYSTEM_DESIGN = [
  {
    id: "sd-chat",
    title: "Chat Application (WhatsApp)",
    crossQA: [
      { q: "How do you handle message ordering across multiple servers?", a: "Use Lamport clocks or hybrid logical clocks per conversation. The message DB (Cassandra) partitions by chatId and clusters by (timestamp, messageId) so all messages for a chat are read in order. Server assigns a monotonic sequence number scoped to the chat." },
      { q: "How do you guarantee exactly-once delivery?", a: "True exactly-once is very hard. Instead: at-least-once delivery + idempotency. Each message has a UUID. Client dedupes by UUID on receive. Server uses Redis SET NX on messageId before inserting to DB — reject duplicates within 24h window." },
      { q: "How does end-to-end encryption work in a group chat?", a: "Use Signal protocol's Sender Keys for groups. One member generates a group key, encrypts it with each member's public key, distributes it. Group messages are then encrypted with the shared sender key — one encrypt per message regardless of group size." },
      { q: "How would you handle media (images, videos) efficiently?", a: "Separate media upload flow: client uploads directly to S3 (presigned URL), server receives only the S3 URL in the message payload. For delivery: CDN in front of S3. For previews: generate thumbnail in a Lambda after upload. Never route media through chat servers." },
      { q: "How do you scale to 2B users with minimal infra?", a: "Horizontal shard by userId (consistent hashing). Each chat server handles ~50K WebSocket connections. Session service maps userId → chat server. Message routing uses Kafka topics per partition. Cities are mostly independent — regional deployments reduce cross-region traffic." },
    ],
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
    crossQA: [
      { q: "How do you handle the celebrity fanout problem?", a: "Hybrid approach: for accounts with <1M followers use fanout-on-write (push to each follower's Redis timeline at tweet time). For celebrities (>1M), fanout-on-read — query their latest tweets at read time and merge. This caps write amplification at ~1M writes per tweet max." },
      { q: "How do you generate a user's timeline in <500ms?", a: "Pre-materialized timeline per user in Redis sorted set (ZADD timeline:uid score tweetId). At read time, fetch top 100 from Redis, hydrate tweet details in parallel. For inactive users (>7 days), regenerate on login in background and return a skeleton first." },
      { q: "How would trending topics work?", a: "Kafka consumers count hashtag/phrase frequency in a sliding window (Flink or Spark Streaming). Trending list rebuilt every 60 seconds, cached globally. Personalized trends: weight by user's country and interests before serving." },
      { q: "How do you prevent spam and abusive content at scale?", a: "Multi-layer: client-side filters → API gateway rules (regex, blocklists) → async ML classifier (post-publish). For high-confidence abuse: shadow ban or soft delete immediately, human review queue for borderline cases. Rate limiting per account for tweet frequency." },
      { q: "How would you design retweets and quote tweets?", a: "Retweet: store (retweetId, originalTweetId, userId, timestamp) — no content copy. Fan-out exactly like regular tweet. Quote tweet: new tweet row with quoteOf=originalTweetId. Rendering: fetch original tweet in parallel. Like counts and retweet counts are denormalized via periodic Flink aggregation jobs." },
    ],
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
    crossQA: [
      { q: "How do you prevent overselling inventory?", a: "Redis atomic DECR: SET inventory:prodId 100, then DECR on add-to-cart. If result < 0: INCR back + reject. Distributed lock (Redlock) for checkout. DB as source of truth: periodic reconciliation. Reserve inventory at cart add (5-min TTL), confirm at checkout." },
      { q: "How would you handle flash sales (10K users hitting checkout simultaneously)?", a: "Queue-based checkout: users enter queue (Redis sorted set by time). Dequeue N at a time (equal to inventory). Others see 'waiting room' with position. Pre-warm all caches. Disable recommendations/non-essential services. Auto-scale checkout service. Rate limit per user." },
      { q: "How do you implement product search with faceted filters?", a: "Elasticsearch: index products with all attributes. Full-text search on name/description. Faceted search (aggregations) for filters: price range, brand, rating, category. Filter queries are AND'd together. Cache popular search queries in Redis. Sync product updates to ES asynchronously via Kafka." },
    ],
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
    crossQA: [
      { q: "How do you guarantee uniqueness of short codes at scale?", a: "Option 1: Central counter (Redis INCR) encoded in Base62 — simple, sequential. Option 2: Distributed pre-generated key pool — a Key Generation Service produces batches of unique codes and stores them. App servers reserve N codes per instance. No coordination at encode time." },
      { q: "What's the difference between 301 and 302 redirects here?", a: "301 Permanent redirect — browser caches it, future clicks go directly to destination, ad platform loses click tracking. 302 Temporary redirect — browser always hits our server, we can track clicks but more latency. TinyURL uses 301 for performance; analytics platforms use 302 for tracking." },
      { q: "How do you handle expiring URLs?", a: "Store expiresAt in the DB. On each redirect, check if NOW() > expiresAt and return 410 Gone if expired. Alternatively, use a Kafka-based TTL job that scans and deletes expired records periodically. For high-traffic expired URLs, cache the 410 response in CDN too." },
      { q: "How would you scale the read path to millions of QPS?", a: "Hot URLs in Redis (LRU cache). Most popular 10% of URLs serve 90% of traffic. CDN edge caches 301 redirects (browser also caches). DB read replicas for cache misses. Sharding by shortCode hash across Cassandra nodes. No single bottleneck in the read path." },
    ],
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
    crossQA: [
      { q: "What happens if Redis goes down — do all requests get blocked?", a: "Fail-open policy: if Redis is unreachable, allow all requests (return limit-pass). This trades safety for availability. Alternatively, fallback to local in-memory counters per instance — approximate but ensures some protection. Log all fail-open events for alerting." },
      { q: "How do you handle distributed counters across multiple app servers?", a: "All servers write to the same Redis cluster (sharded by rate-limit key). Redis INCR + EXPIRE is atomic. For ultra-high throughput, use local counter per server and sync to Redis every 100ms — slight inaccuracy but 10x fewer Redis round-trips. Token bucket with local leaky bucket + periodic Redis sync." },
      { q: "How would you implement different limits for different user tiers?", a: "Config service stores tier → (limit, window) mapping. Rate limiter looks up user tier first (cached in Redis or local), then applies appropriate limits. Key format includes tier: rate:{tier}:{userId}:{window}. Premium users get higher limits without code changes — just config update." },
      { q: "How is sliding window different from fixed window, and why does it matter?", a: "Fixed window: allow 100 req/min. At 11:59 someone sends 100 req, then at 12:00 window resets and they send 100 more — 200 req in 2 seconds. Sliding window log tracks exact timestamps — no boundary burst. Sliding window counter is a weighted approximation: currentCount + prevCount × (1 - elapsed/windowSize)." },
    ],
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
    crossQA: [
      { q: "How do you handle 100 charts on one page without it freezing?", a: "Virtualize off-screen widgets using Intersection Observer — only mount charts in viewport. Lazy-load chart library (~200KB). Stagger data fetches to avoid 100 simultaneous API calls. Use React.memo on chart components. Web workers for heavy data transforms (CSV parsing, aggregations)." },
      { q: "How do you make dashboard shareable with current filter state?", a: "Encode all filter state (date range, segments, active widgets) as URL query params. Dashboard layout encoded as compact JSON in URL or stored in DB with a share ID. On load, parse URL params and hydrate filter store. This makes every view sharable and bookmarkable." },
      { q: "How do you handle real-time updates without hammering the API?", a: "SSE (Server-Sent Events) for widgets that need live updates — server pushes when data changes. For less-critical widgets, polling with exponential backoff. React Query's refetchInterval with staleTime prevents redundant fetches. Only subscribe to SSE for widgets in viewport." },
    ],
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
    crossQA: [
      { q: "How do you implement federated search (show results from multiple sources)?", a: "Parallel API calls to multiple backends (products, users, articles). Promise.allSettled waits for all. Merge results into categorized sections (Products: [...], People: [...], Articles: [...]). Show partial results as each API resolves (progressive enhancement). Cap total suggestions at 10 across all categories." },
      { q: "How would you rank suggestions?", a: "Signals: (1) exact prefix match scores higher. (2) query frequency (popular queries rank higher). (3) personalization: user's past selections for this query. (4) freshness: recent items boosted. Score = base_popularity × prefix_score × personalization_weight. ML ranking model for complex cases." },
      { q: "How do you handle mobile keyboard UX?", a: "Debounce to 300ms (mobile keyboards fire many events). Don't show dropdown until 2+ chars (avoids single-char results). Ensure dropdown doesn't get covered by virtual keyboard — position above input if near bottom. Touch events for selection (touchend, not click). Large touch targets (44px min per WCAG)." },
    ],
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
    id: "sd-notification",
    title: "Notification System",
    crossQA: [
      { q: "How do you prevent notification storms from sending millions of duplicates?", a: "Idempotency key per notification event (eventId + userId + channel). Redis SET NX with 24h TTL before sending — skip if key exists. Dedup window in Kafka consumer group. Delivery tracking table stores every sent notification with status, preventing replay on crash." },
      { q: "How do you handle user preferences like 'no push after 10pm'?", a: "User preferences stored in Postgres, cached in Redis (read-heavy). Preference check happens before enqueueing: quiet hours → delay notification to next allowed window using a delayed queue (Redis ZADD with future timestamp or Kafka scheduled message). Separate worker drains delayed queue." },
      { q: "How would you handle a case where FCM/APNs is down?", a: "Circuit breaker on each provider. On open: queue notifications in Kafka dead-letter topic. Background job retries with exponential backoff. After provider recovers, drain backlog. For critical notifications (OTP, alerts), failover to SMS automatically. Monitor provider SLAs and alert early." },
    ],
    track: "both",
    scale: "100M users, 1B notifications/day",
    prompt: "Design a multi-channel notification service (push, email, SMS) with priorities, preferences, rate limits, and delivery tracking.",
    requirements: [
      "Channels: push (FCM/APNs), email, SMS, in-app",
      "Priority queues (critical vs promotional)",
      "User preferences (which channels, quiet hours)",
      "Delivery tracking (sent, delivered, read, failed)",
      "Rate limiting per user",
      "Template system with variables",
    ],
    approach: `**Architecture:**
1. API Gateway → Notification API (REST/gRPC)
2. Notification Service validates + templates, pushes to priority queue
3. Priority Queue (Kafka topics per priority)
4. Channel Workers (push, email, SMS) consume → call providers
5. Delivery tracking → event bus → analytics

**Key Decisions:**
- **Per-user rate limits** (Redis sliding window)
- **Exactly-once ≠ realistic** — use at-least-once + idempotency keys + dedupe window
- **Fanout on write** for 1:1, batch for broadcast
- **User preferences** cached in Redis (read-heavy)
- **Templates** stored in S3/DB, compiled on demand

**Scale:**
- 1B notifs/day = 11K/sec avg, 100K/sec peak
- Kafka partitions by userId for ordering + parallelism
- Provider rate limits (FCM 300 req/sec per project) → shard across projects`,
    components: "API Gateway, Notification Service, Priority Queue (Kafka), Channel Workers, Template Service, Rate Limiter (Redis), Delivery Tracker, Analytics",
    tradeoffs: ["At-least-once + idempotency over exactly-once", "Priority queues to starve low-priority vs fair sharing"],
  },
  {
    id: "sd-ride",
    title: "Uber / Ride Sharing",
    crossQA: [
      { q: "How do you match a rider to a nearby driver efficiently?", a: "Drivers publish GPS every 4s. Server stores location in Redis GEOADD (O(log N) insert). On ride request: GEORADIUS query for drivers within 2km, sorted by distance. Send offer to top 3 drivers in parallel, first to accept wins. QuadTree or H3 hexagonal indexing for more complex spatial queries." },
      { q: "How does surge pricing work technically?", a: "Supply/demand ratio computed per geo cell (H3 hex ~1km²) every 60s. Worker reads active driver count + pending ride count per cell from Redis. Multiplier = demand/supply ratio capped at 4x. Applied at quote time, stored on the ride record so fare is computed at pre-agreed multiplier." },
      { q: "How do you handle driver location updates at massive scale?", a: "5M active drivers × 1 update/4s = 1.25M location writes/sec. Use a dedicated Location Service with write-optimized in-memory store (Redis or custom). Batch updates (collect 4s of positions per driver, write once). Only persist last N positions per driver; historical trips stored in separate append-only log." },
    ],
    track: "be",
    scale: "100M riders, 5M drivers, 20M trips/day",
    prompt: "Design a ride-sharing service: match nearby drivers, track trips in real-time, handle surge pricing, compute fares, process payments.",
    requirements: [
      "Book a ride → match nearest driver",
      "Real-time driver location updates",
      "ETA predictions",
      "Surge pricing during high demand",
      "Trip lifecycle + fare calculation",
      "Rating both parties",
    ],
    approach: `**Matching:**
- Drivers publish location (every 4s) via WebSocket
- Server uses **QuadTree / Geohash / H3** to index drivers spatially
- Ride request → query N nearest drivers in cell → broadcast offer → first to accept wins

**Data Storage:**
- Driver locations: Redis GEO commands or in-memory cache (fast, ephemeral)
- Trips: Postgres (ACID for fare calculation)
- User data: Postgres
- Event log: Kafka (for analytics, replay)

**Surge Pricing:**
- Supply/demand ratio per cell, updated every minute
- Multiplier applied at quote time

**Scaling:**
- Partition by city (separate clusters per region)
- Cities are mostly independent → horizontal split easy

**Challenges:**
- Consistency vs latency — driver matching is soft (don't block on strong consistency)
- WebSocket connections at scale (millions concurrent) — use connection brokers (Netty, Vert.x)
- Hot cells (airport, downtown) — more compute allocated`,
    components: "Location Service (geo index), Matching Service, Trip Service, Pricing Service, Payment Service, Notification",
    tradeoffs: ["AP over CP for matching", "Geo-indexed in-memory vs DB for speed"],
  },
  {
    id: "sd-netflix",
    title: "Netflix / Video Streaming",
    crossQA: [
      { q: "How does adaptive bitrate streaming (ABR) work?", a: "Video transcoded to multiple quality levels (240p, 480p, 720p, 1080p, 4K). Manifest file (HLS .m3u8 or DASH .mpd) lists all variants. Player measures download speed + buffer level every 2s. ABR algorithm (e.g., BOLA, Buffer-based): select quality level such that buffer doesn't deplete. Shift up/down quality smoothly based on bandwidth estimate." },
      { q: "How do you handle a new popular show causing massive traffic spike?", a: "Pre-warm CDN edges before premiere (push content proactively). Auto-scale microservices (K8s HPA on request rate). Circuit breaker on recommendation service — degrade to popular list if ML model is slow. Traffic shaping: queue watch requests if overwhelmed. Test: load test to 2x expected peak before launch." },
      { q: "How do you implement resume watching across devices?", a: "Store playback position server-side: PUT /watch-progress { contentId, position, deviceId }. Read on playback start. Conflict resolution (watched on two devices offline): server uses max(position) or most recent timestamp. Sync periodically during playback (every 10s) + on pause/exit. Store in user's progress DB (userId, contentId, position, updatedAt)." },
    ],
    track: "be",
    scale: "200M users, 1B hours/month, 4K = 7GB/hour",
    prompt: "Design a video streaming service: upload, transcode, adaptive bitrate streaming, CDN delivery, recommendations.",
    requirements: [
      "Ingest + transcode to multiple bitrates (240p → 4K HDR)",
      "Adaptive bitrate streaming (HLS / DASH)",
      "Global CDN distribution",
      "User history, recommendations",
      "DRM for premium content",
    ],
    approach: `**Upload Pipeline:**
1. Creator uploads master file → S3
2. Transcoding service (FFmpeg workers, GPU) → multiple bitrates + formats (HLS, DASH)
3. Chunk into 2-10s segments
4. Push to CDN (Cloudflare, AWS CloudFront, or Netflix's Open Connect)

**Playback:**
1. Client requests manifest (.m3u8 for HLS)
2. Manifest lists segments at multiple bitrates
3. Client picks bitrate based on bandwidth, downloads segments
4. **Adaptive**: switches bitrate if bandwidth changes

**Recommendations:**
- Offline ML jobs (Spark) build user-item matrix
- Collaborative filtering + content-based
- Real-time personalization via feature store

**CDN Strategy:**
- Netflix pushes to ISPs (Open Connect boxes in their DC)
- ~90% of traffic served from edge, ~10% from origin

**Scale math:**
- 200M × 2 hours/day × 4K (7GB/hour) = massive egress
- Why Netflix built their own CDN`,
    components: "Upload, Transcoding (FFmpeg on GPU), Storage (S3), CDN, Catalog Service, Recommendation ML, DRM, Analytics",
    tradeoffs: ["CDN edge boxes ($) vs CDN provider (flexibility)", "Transcoding time vs output quality vs storage cost"],
  },
  {
    id: "sd-payment",
    title: "Payment System (Razorpay)",
    crossQA: [
      { q: "How do you prevent double charging on network retries?", a: "Client generates a UUID idempotency key per payment attempt and includes it in every request. Server does DB insert: INSERT INTO payments (idempotency_key, ...) ON CONFLICT (idempotency_key) DO NOTHING — then return the existing result. Idempotency keys stored 24-48h. This makes retry-safe at DB level." },
      { q: "What is double-entry bookkeeping and why does payment need it?", a: "Every money movement creates two equal-and-opposite ledger entries (debit + credit) summing to zero. Example: user pays ₹1000 → debit user_wallet ₹1000, credit escrow ₹1000. On settlement: debit escrow ₹1000, credit merchant ₹1000. This ensures SUM(all balances) = 0 always — makes auditing mathematically verifiable." },
      { q: "How would you implement refunds reliably?", a: "Refund as a Saga: (1) Create refund record (pending), (2) Call payment provider refund API, (3) On success → reverse ledger entries, (4) Notify user. Each step emits event. Failure at step 2 → compensating action: mark refund failed, alert support. Idempotency on refund too — same refund ID never processed twice." },
      { q: "How do you handle fraud detection without blocking legitimate transactions?", a: "Async ML scoring: transaction is processed optimistically, fraud model scores async in <50ms. If score above threshold, flag for review or auto-reverse. Rules engine (velocity checks, device fingerprint, impossible travel) runs synchronously for hard blocks. Chargeback ML trained on historical fraud patterns." },
    ],
    track: "be",
    scale: "10M txns/day, 99.99% uptime, <500ms latency",
    prompt: "Design a payment gateway processing credit card, UPI, wallet payments. Handle idempotency, refunds, settlement, fraud.",
    requirements: [
      "Multiple payment methods (card, UPI, netbanking, wallet)",
      "Idempotency (no double charges)",
      "Retry logic with external providers",
      "Double-entry bookkeeping (ledger)",
      "Refunds (partial / full)",
      "Reconciliation with banks/PSPs",
      "Fraud detection",
      "PCI-DSS compliance",
    ],
    approach: `**Core Principles:**
- **Never lose money** — idempotency + ledger
- **Audit everything** — immutable event log
- **Separate money movement from rendering UI**

**Architecture:**
1. API Gateway (auth, idempotency check via key)
2. Payment Orchestrator — Saga pattern
3. Provider Adapters (card networks, UPI, wallets) — circuit breakers
4. Ledger Service (double-entry bookkeeping)
5. Reconciliation Service (match our records with bank reports)
6. Fraud Service (ML scoring, rules)
7. Notification Service

**Idempotency:**
- Client sends \`Idempotency-Key\` on every payment attempt
- Server stores (key → response) for 24h
- Retry with same key → returns cached result (no double charge)

**Ledger:**
- Every transaction creates equal debit + credit entries
- Example: "user pays merchant $100" → debit user account $100, credit merchant account $100
- Balances always sum to zero

**Saga for Refund:**
- Payment.refund → update ledger → notify provider → notify merchant → notify user
- Each step emits event; failure triggers compensation

**Scale:**
- DB partitioning by merchant_id
- Read replicas for dashboards/reports
- Async settlement jobs

**Compliance:**
- Never store raw card numbers (use provider tokens)
- TLS everywhere, encrypt at rest
- PCI-DSS audits, SOC 2`,
    components: "API Gateway, Payment Orchestrator, Provider Adapters, Ledger (Postgres), Reconciliation, Fraud (ML), Notification, Dashboard (analytics DB)",
    tradeoffs: ["Sync orchestration vs async saga (latency vs resilience)", "Full ledger reads vs cached balance"],
  },
  {
    id: "sd-bookmyshow",
    title: "BookMyShow / Ticket Booking",
    crossQA: [
      { q: "How do you prevent two users from booking the same seat?", a: "Optimistic locking: seat has version field. First booker increments version — others' updates fail (version mismatch) and retry. Pessimistic (SKIP LOCKED): SELECT ... WHERE status='available' FOR UPDATE SKIP LOCKED — locks row, others skip to next available seat. For high contention: Redis set-based reservation (SETNX seat:123:seatId userId, TTL=10min) before DB commit." },
      { q: "How do you handle seat hold expiry?", a: "Seat enters 'HELD' state with holdExpiresAt = NOW() + 10min. User has 10min to complete payment. Background job (or DB event) checks expired holds: SELECT seats WHERE status='HELD' AND holdExpiresAt < NOW() → reset to 'AVAILABLE'. Or: lazy evaluation — check expiry on every read request. Redis TTL approach: SETNX with EX 600, auto-expires." },
      { q: "How do you scale to 50K concurrent users during a popular concert sale?", a: "Virtual waiting room: queue users before sale opens (Redis sorted set by arrival time). Release N users every second based on checkout capacity. Pre-compute seat availability (cache in Redis before sale). Read replicas for seat queries. Distribute load: shard by show_id. Degrade gracefully: if DB slow, serve cached seat map." },
    ],
    track: "be",
    scale: "50K concurrent users per event, 10M bookings/day",
    prompt: "Design a ticket booking system for movies/events. Handle concurrent seat selection, payment, cancellation.",
    requirements: [
      "Browse shows + seat layout",
      "Concurrent seat holding (prevent double-booking)",
      "Payment integration",
      "Booking confirmation",
      "Cancellation with refund",
      "Handle burst traffic (Avengers release)",
    ],
    approach: `**The Core Challenge: Concurrent Seat Selection**

Two users clicking same seat at the same time. Must prevent double-booking.

### Option A: Distributed Lock (Redis)
\`\`\`
SET seat:show-42:A5 user-123 NX EX 300
→ if NX succeeded, user-123 holds for 5 min
→ else, "Seat already selected"
\`\`\`

### Option B: Optimistic Locking (DB)
\`\`\`sql
UPDATE seats SET status='HELD', held_by=?, expires_at=NOW()+INTERVAL '5 min'
WHERE show_id=? AND seat_id=? AND status='AVAILABLE';
-- 0 rows affected → someone beat you
\`\`\`

**Architecture:**
1. Browse layer (CDN cached for popular events)
2. Seat Service (Redis for hold + Postgres as source of truth)
3. Booking Service (finalizes on payment success)
4. Payment Gateway
5. Notification Service

**Flow:**
1. User picks seat → \`SeatService.hold(showId, seatId, userId)\` (5 min TTL)
2. User pays → \`BookingService.confirm(holdId, paymentToken)\`
3. On confirm: write to DB, release hold, send email
4. On timeout: automatic release

**Handling Bursts:**
- Virtual queue (wait room) for hot events
- WebSocket updates when seats taken
- Read-only mode in overload

**Cancellation:**
- Mark seat available again
- Initiate refund (saga with payment)`,
    components: "Browse (CDN), Seat Service (Redis + Postgres), Booking Service, Payment, Notification, Queue (for hot events)",
    tradeoffs: ["Pessimistic locks (simple) vs optimistic (scales)", "Redis holds (fast) vs DB (durable)"],
  },
  {
    id: "sd-search",
    title: "Search Engine (Google-lite)",
    crossQA: [
      { q: "How does an inverted index work?", a: "For each word in all documents: store list of (docId, position) pairs. Index: { 'python': [(doc1, 5), (doc7, 12)], 'design': [...] }. Query 'python design': intersect doc lists for both words → docs containing both. Stored sorted by docId for efficient merge. Compression: delta encoding (store differences, not absolute IDs)." },
      { q: "How does PageRank work and why?", a: "Web is a graph. PageRank: a page is important if many important pages link to it. Iterative computation: PR(page) = (1-d)/N + d × Σ(PR(linking_page)/links_from_linking_page). d=damping factor (0.85). Converges after ~100 iterations. Modern: many more signals (freshness, click-through, mobile-friendliness) — PageRank is one of 200+ factors." },
      { q: "How would you handle web crawling without overloading websites?", a: "Politeness: obey robots.txt, crawl-delay directive. Crawl budget per domain (N pages/day). Domain-based queues: one worker per domain to enforce rate limiting. Retry with exponential backoff on 429/503. User-agent identification. Prioritize: sitemaps, high-PR pages, recently modified (If-Modified-Since headers). Distributed via consistent hashing by domain." },
    ],
    track: "be",
    scale: "10B pages, 8B queries/day, <200ms latency",
    prompt: "Design a web search engine: crawl, index, rank, serve queries.",
    requirements: [
      "Crawl billions of pages",
      "Build inverted index",
      "Rank results (relevance, authority)",
      "Serve queries in <200ms",
      "Update index continuously",
      "Spell correction, autocomplete",
    ],
    approach: `**Components:**
1. **Crawler** — bots fetch pages, respect robots.txt, politeness (1 req/sec per domain)
2. **URL Frontier** — priority queue of URLs to crawl
3. **Indexer** — parses pages, builds inverted index (word → [docs])
4. **Ranker** — PageRank, BM25, signals like freshness, authority
5. **Query Serving** — receives query, fetches from index, ranks, returns
6. **Autocomplete** — separate trie-based service

**Inverted Index:**
\`\`\`
"python" → [doc1, doc7, doc42, ...]
"async"  → [doc7, doc15, ...]
Query "python async" → intersect → [doc7]
\`\`\`

**Sharding:**
- Index sharded by term hash (term → shard)
- Or by document (scatter-gather)
- Replication for redundancy + read throughput

**PageRank:**
- Authority based on link graph
- Pages linked by high-authority pages → higher score

**BM25:**
- Term frequency × inverse document frequency
- Tuned with document length normalization

**Serving Query:**
1. Query → parse, spell correct
2. Broadcast to index shards
3. Each returns top N candidates
4. Aggregate + re-rank at root
5. Return top 10

**Caching:**
- Hot queries cached (80% of traffic from 20% queries)
- Query → results cache
- Personalization applied after cache`,
    components: "Crawler, URL Frontier, Parser, Indexer, Ranking Engine (PageRank + BM25), Serving Layer, Cache, Spell Checker, Autocomplete",
    tradeoffs: ["Index freshness (re-crawl rate) vs cost", "Personalization vs cache hit rate"],
  },
  {
    id: "sd-api-gateway",
    title: "API Gateway",
    crossQA: [
      { q: "How does an API gateway differ from a load balancer?", a: "Load balancer: distributes traffic to same-service instances (L4/L7). API gateway: protocol translation, request routing to different microservices, authentication, rate limiting, request/response transformation, API composition (aggregate multiple service calls into one response). Gateway operates at application layer; LB at network/transport layer." },
      { q: "How do you implement canary deployments via API gateway?", a: "Traffic splitting: route X% of requests to new version, 100-X% to stable. Based on: random percentage, user-agent header, specific user cohort (cookie/header). Kong/Nginx: upstream with weighted servers. Monitor error rate on canary — auto-rollback if errors > threshold. Gradually increase: 1% → 5% → 25% → 100%." },
      { q: "How does the gateway handle circuit breaking?", a: "Circuit breaker states: Closed (all requests pass), Open (all fail fast), Half-open (test one request). Open triggers when error rate > 50% in 10s window. In open state: return 503 without hitting downstream (saves resources). Half-open: let one request through. If success → Closed. If fail → back to Open. Timeout: 30s in Open before trying Half-open." },
    ],
    track: "be",
    scale: "100K req/sec, <5ms overhead, 99.99% uptime",
    prompt: "Design an API gateway sitting in front of many microservices: auth, rate limit, routing, load balancing, logging.",
    requirements: [
      "Route based on path/host",
      "JWT / OAuth token validation",
      "Rate limiting (per user, per endpoint)",
      "Load balancing across backend instances",
      "Circuit breaker (protect failing backends)",
      "Request/response transformation",
      "Logging + metrics",
    ],
    approach: `**Architecture:**
Client → Load Balancer → API Gateway instances (stateless) → Backend services

**Request Flow:**
1. Receive request
2. Auth: verify JWT signature (cache pub key)
3. Rate limit check (Redis counter)
4. Route lookup (path → backend cluster)
5. Circuit breaker check (backend healthy?)
6. Load balance across backend instances (round robin / least-conn)
7. Forward request
8. Transform response (redact, rename fields)
9. Log + emit metrics
10. Return to client

**Rate Limiting:**
- Redis Lua script (atomic): INCR + EXPIRE
- Per-user + per-endpoint
- 429 response with \`X-RateLimit-Remaining\` header

**Circuit Breaker:**
- Failure rate > threshold → Open (fail fast)
- Half-open after cooldown → test recovery

**High Availability:**
- Stateless gateway → horizontal scaling trivial
- Multiple regions / AZs
- Gateway itself needs zero-downtime deploys (canary, blue-green)

**Open source options:** Kong, Envoy, NGINX, Traefik, AWS API Gateway

**Trade-offs:**
- Add latency (5-10ms) but saves work from every backend
- Single source of policies (auth, rate limit) → consistency
- Becomes critical SPOF — needs extreme care`,
    components: "Load Balancer, Gateway instances (Kong/Envoy), Auth service, Rate limiter (Redis), Service registry/discovery, Config DB, Metrics (Prometheus)",
    tradeoffs: ["In-gateway auth (centralized) vs per-service (flexible)", "Static config vs dynamic (reload cost)"],
  },
  {
    id: "sd-file-storage",
    title: "File Storage (Dropbox / Drive)",
    crossQA: [
      { q: "How does block-level deduplication work?", a: "File split into variable-size blocks using content-defined chunking (Rabin fingerprint). Hash each block (SHA-256). Global hash table: if block hash exists → reuse stored block. File manifest stores ordered list of block hashes. Dedup ratio: 40-50% for typical user data. Storage saving = blocks deduplicated × block size." },
      { q: "How do you sync files across devices efficiently (delta sync)?", a: "On file change: compute diff against last synced version. Only upload changed blocks (not entire file). Client tracks last sync state (block hashes) locally. rsync algorithm: client sends rolling checksums, server responds with diff instructions. New file: chunked upload of all blocks. Conflict: both devices modified → fork with conflict copies ('filename (conflict 2024-01-15).txt')." },
      { q: "How would you implement real-time collaboration (Google Docs-like) on top of file storage?", a: "For structured documents: CRDT-based collab (separate from file storage). File storage handles save/restore at the document level. Collaboration layer: stores op log + latest snapshot. Merge: CRDT guarantees convergence. Conflict-free: two editors make changes → CRDT merges automatically. File storage used for durable snapshot persistence." },
    ],
    track: "be",
    scale: "1B files, 100M users, 2PB storage, 10GB max file",
    prompt: "Design a cloud file storage service: upload, download, sync across devices, share, version history.",
    requirements: [
      "Chunked upload (resumable, large files)",
      "Delta sync (only send changed chunks)",
      "Multi-device sync",
      "Conflict resolution",
      "File versioning",
      "Sharing (links, permissions)",
      "Deduplication (block-level)",
    ],
    approach: `**Block-Level Storage:**
- Split files into 4MB chunks
- Hash each chunk (SHA256) — content-addressed
- Store chunk in S3 under its hash
- File metadata = ordered list of chunk hashes

**Dedup:**
- Same content everywhere = one stored copy
- Same user uploads same file twice → zero new storage
- Users saving same PDF → one copy

**Upload Flow:**
1. Client splits file → hashes chunks
2. Sends hash list to server
3. Server replies with which hashes are missing
4. Client uploads only missing chunks
5. Server updates metadata

**Delta Sync (diff-based):**
- Client computes signature of current file version
- Server sends changed blocks only
- Massive bandwidth savings for small edits to big files

**Conflict Resolution:**
- Version vector (device ID → version)
- Two concurrent edits → create conflict file ("Conflict 2024-04-18")
- Or: last-write-wins with history preserved

**Sync:**
- Client long-polls / WebSocket for changes
- Push notifications when desktop is offline
- Background daemon reconciles on reconnect

**Components:**
- Upload service
- Metadata DB (Postgres, sharded by user_id)
- Block storage (S3)
- Sync server (WebSocket)
- Sharing service (ACL)

**Scale:**
- 2PB storage, but dedup + compression can reduce to ~500TB actual
- Egress cost is bigger than storage cost
- CDN for shared public links`,
    components: "Upload Service, Metadata DB, Block Storage (S3), Sync Server (WebSocket), Sharing Service (ACL), CDN",
    tradeoffs: ["Block size (small = better dedup, large = less metadata overhead)", "Versioning depth vs storage cost"],
  },
  {
    id: "sd-stock",
    title: "Stock Trading Platform (Zerodha)",
    crossQA: [
      { q: "How does an order matching engine work?", a: "Order book: two sorted lists — bids (descending price) and asks (ascending price). New buy order: match against cheapest asks. New sell order: match against highest bids. FIFO within same price level. Partial fills: order can be split across multiple counter-orders. Market order: match immediately at best available price. Limit order: queue if no match." },
      { q: "How do you achieve microsecond latency in order matching?", a: "Single-threaded event loop (no locks). All data in RAM (no DB calls on hot path). Zero-copy networking (kernel bypass: DPDK, RDMA). Pre-allocate memory (no GC pauses). Custom data structures: doubly-linked list for price level queues, red-black tree for price levels. Co-locate matching engine with exchange (proximity hosting)." },
      { q: "How do you handle market data (real-time quotes) at massive scale?", a: "Market data feed: multicast UDP (one packet → all subscribers simultaneously). Sequence numbers on every packet — missing sequence → request retransmit from replay service. Clients subscribe to specific symbols. FIX protocol or proprietary binary format (minimize latency). CDN/WebSocket for retail clients (millisecond latency acceptable)." },
    ],
    track: "be",
    scale: "10M orders/day, <10ms matching latency, real-time quotes",
    prompt: "Design a stock trading platform: place orders, match orders, stream quotes, manage portfolios.",
    requirements: [
      "Low-latency order matching (<10ms)",
      "Order book management per symbol",
      "Real-time market data feed (thousands of ticks/sec)",
      "Portfolio tracking, P&L",
      "Risk checks before order placement (margin)",
      "Regulatory compliance, audit trail",
    ],
    approach: `**Core: Order Matching Engine**

- **Order book** per symbol: two heaps — buy (max) + sell (min)
- Incoming BUY at price ≥ lowest SELL → match → generate trade
- Otherwise add to book

Must be:
- **Deterministic** — identical input → identical output
- **Ordered** — FIFO within price level
- **Fast** — in-memory, single-threaded per symbol
- **Durable** — persist every op to log before applying (for crash recovery)

Implementations: single-process matcher per symbol, partition symbols across nodes.

**Market Data:**
- Matcher publishes every trade + book update
- Feed service broadcasts via WebSocket / multicast
- Thousands of subscribers — use pub/sub tree

**Risk Check (pre-trade):**
- Verify margin, lot size, price band (circuit breaker)
- Must be fast — < 1ms

**Portfolio:**
- Read model built from trade feed
- Cached in Redis for quick reads
- Durable source: trade log

**Settlement:**
- T+1 or T+2 (next 1-2 business days)
- Settlement service transfers cash + shares via clearing house

**Compliance:**
- Every order, quote, trade logged (immutable)
- Access controls (user can't see others' data)
- Surveillance for wash trading, spoofing`,
    components: "Order Gateway, Risk Service, Matching Engine (per symbol), Market Data Feed, Portfolio Service, Settlement, Surveillance",
    tradeoffs: ["In-memory matcher (speed) vs durability (log + snapshot)", "UDP multicast (fast) vs TCP (reliable)"],
  },
  {
    id: "sd-recommendation",
    title: "Recommendation System",
    crossQA: [
      { q: "What is the cold start problem and how do you solve it?", a: "New user or new item has no interaction history. Solutions: (1) New user: ask onboarding questions (preferences), show popular items, use demographic-based recommendations. (2) New item: content-based filtering (item attributes), editorial boosts. (3) Hybrid: switch from content-based to collaborative as interactions accumulate." },
      { q: "How do you evaluate recommendation quality?", a: "Offline metrics: precision@K (of top-K recs, how many are relevant), recall@K, NDCG (ranking quality). Online (A/B): click-through rate, engagement rate, conversion, session length. Diversity metric: avoid echo chamber (ensure variety). Serendipity: measure surprise factor. Business metric: revenue per recommendation." },
    ],
    track: "be",
    scale: "100M users, sub-second recommendations, updated daily",
    prompt: "Design a recommendation system for products/videos/content. Support personalization + cold start.",
    requirements: [
      "Personalized recommendations per user",
      "Handle cold start (new user, new item)",
      "Real-time (react to recent behavior)",
      "A/B testing framework",
      "Sub-second response time",
    ],
    approach: `**Offline + Online Pipeline:**

### Offline (batch, daily)
1. Collect user-item interactions (clicks, purchases, watches)
2. Train models:
   - **Collaborative filtering** — "users like you also liked..."
   - **Content-based** — similar items by features (embeddings)
   - **Matrix factorization** — ALS, embeddings
   - **Deep learning** — two-tower, DCN, transformers
3. Generate candidates for each user (top 500-1000)
4. Store in fast KV (Redis, DynamoDB)

### Online (real-time)
1. User opens app → fetch candidates (cached)
2. **Ranker** scores top 50 considering:
   - Recent behavior (last session)
   - Context (time, location, device)
   - Freshness, diversity
3. Apply business rules (don't recommend already-purchased)
4. Return top 10-20

**Cold Start:**
- **New user**: show popular items + onboarding (pick 3 interests)
- **New item**: content-based matching (features, not history)
- Exploration: randomly show new items to gather signal

**Feature Store:**
- Centralized store of user + item features
- Feature pipeline ingests events, computes features
- Served online at inference time

**A/B Testing:**
- Assign users to experiments (bucketed by userId hash)
- Log treatment for every request
- Analyze metrics post-experiment

**Scale:**
- Candidate gen can be batch (cheap)
- Ranking is online — must be fast. GPU-accelerated models, batched inference
- Feature computation: real-time (Flink) + batch (Spark)`,
    components: "Event Pipeline (Kafka), Batch Training (Spark), Model Store, Candidate Store (Redis), Feature Store, Ranker Service, A/B framework",
    tradeoffs: ["Candidate gen (coverage) vs ranking (precision)", "Batch freshness (cheap) vs real-time (expensive)"],
  },
  {
    id: "sd-ad-platform",
    title: "Ad Serving Platform",
    crossQA: [
      { q: "How does real-time bidding (RTB) work in <100ms?", a: "Ad exchange sends bid request to DSPs (demand-side platforms) when user loads page. DSPs have 80ms to respond with bid + ad creative. Exchange runs auction (second-price), returns winner. Winner's ad served to user. Pipeline: parse request → lookup user segments → query campaign eligibility → run bid price model → respond. Everything pre-computed; only scoring done in real-time." },
      { q: "How do you prevent click fraud?", a: "Multi-layer detection: (1) Invalid traffic (IVT) filter: detect bots via mouse patterns, click velocity, IP reputation. (2) Publisher fraud: clicks without engagement (bounce in <1s). (3) Competitor fraud: clicking competitor's ads. ML model scores each click on 50+ features. Suspicious clicks invalidated, advertiser not charged. Periodic audit by specialized fraud detection service (IAS, DoubleVerify)." },
    ],
    track: "be",
    scale: "1M QPS, <100ms latency, bidding",
    prompt: "Design an ad serving system with real-time bidding, budget pacing, click tracking.",
    requirements: [
      "Show most relevant ad to user (auction)",
      "Enforce advertiser budgets",
      "Pace spend across the day",
      "Track impressions + clicks + conversions",
      "Fraud detection",
      "Sub-100ms latency (or lose impression opportunity)",
    ],
    approach: `**Request Flow:**
1. Publisher request: "show ad for user X on page Y"
2. Ad Server matches eligible ads (targeting: age, location, interests)
3. Runs auction (second-price)
4. Returns winning ad
5. Impression logged → click tracked if user clicks → conversion if purchased

**Targeting:**
- User profile (segments, demographics)
- Content (keywords, category)
- Context (time, device, location)

**Auction:**
- All eligible ads bid
- Winner = highest bid × quality score
- Pay second-highest price (incentive-compatible)

**Budget Pacing:**
- Daily budget split across hours based on predicted traffic
- Real-time counter in Redis: decrement per impression
- Alert/throttle as budget depleted

**Click Tracking:**
- Redirect through ad server (stamp click ID)
- Attribution window (e.g., 24h post-click, 7d post-view)

**Fraud:**
- Rule-based (IP velocity, impossible metrics)
- ML for suspicious patterns
- Block bots, devices

**Scale:**
- Ad serving is read-heavy, write-heavy for tracking
- Distributed cache for user profiles (Redis, Aerospike)
- Kafka for event log → real-time + batch processing
- ClickHouse for analytics

**Latency Budget:**
- 100ms total — can't afford long-tail
- Everything cached, parallel fetch
- Graceful degradation if cache miss (show popular ad)`,
    components: "Ad Server, Profile Service, Targeting Engine, Auction Engine, Budget Service (Redis), Event Pipeline (Kafka), Analytics (ClickHouse), Fraud Service",
    tradeoffs: ["Strict budget (accurate but slow) vs pacing (approximate)", "Personalization depth vs latency"],
  },
  {
    id: "sd-docs",
    title: "Collaborative Editor (Google Docs)",
    crossQA: [
      { q: "OT vs CRDT — which would you choose and why?", a: "OT (Operational Transformation): needs a central server to serialize and transform ops — simpler mental model, proven in Google Docs. CRDT (Conflict-free Replicated Data Type, e.g., Yjs, Automerge): merges automatically without coordination, enables true P2P and offline-first. Choose CRDT for new systems — better offline support and no central bottleneck." },
      { q: "How do you handle offline edits when user reconnects?", a: "Client buffers all ops locally (IndexedDB). On reconnect, sends buffered ops as a batch. Server transforms them against all ops that happened during disconnect using OT, or CRDTs handle merge automatically. Client fast-forwards its local state. Conflict: for text, auto-merge via algorithm. For structural conflicts (delete vs edit), show diff to user." },
      { q: "How do you store version history efficiently?", a: "Store full snapshots every N ops (e.g., every 100) in S3/object store. Between snapshots, store op log (append-only). To reconstruct doc at time T: load nearest snapshot before T, replay ops until T. This balances storage cost vs replay cost. Never delete snapshots — they're immutable history." },
    ],
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
  // ─── FE SYSTEM DESIGN (missing from Excel) ────────────────────────────────
  {
    id: "sd-google-calendar",
    title: "Google Calendar (Frontend)",
    track: "fe",
    prompt: "Design a Google Calendar-like UI: month/week/day views, recurring events, drag-to-move, invite attendees, timezone support.",
    requirements: [
      "Functional: Month/Week/Day/Agenda views, Create/Edit/Delete events, Recurring events (daily/weekly/monthly/custom RRULE), Drag to move/resize, Invite attendees, Color labels, Timezone support",
      "Non-functional: Smooth 60fps interactions, Offline mode, Fast initial load, Accessible",
    ],
    approach: `**Component Architecture:**
- CalendarShell (view switcher, date navigation)
- MonthView → WeekView → DayView → AgendaView
- EventBlock (draggable, resizable)
- EventModal (create/edit form)
- MiniCalendar (date picker sidebar)

**State Management:**
- Events in Zustand/Redux, keyed by date range
- Current view + selected date in URL params (shareable)
- Optimistic updates on create/move — rollback on error

**Recurring Events:**
- Store as RRULE string (RFC 5545): FREQ=WEEKLY;BYDAY=MO,WE,FR
- Generate occurrences client-side for visible range (do NOT expand in DB)
- Exception dates stored separately (moved/deleted occurrences)
- Library: rrule.js

**Drag & Drop:**
- React DnD or custom pointer events
- Snap to 15-min intervals
- Ghost element while dragging
- Multi-day events span across day columns

**Timezone Handling:**
- Store all times in UTC in DB
- User's timezone in profile
- Display using Intl.DateTimeFormat with timezone
- Temporal API (or Luxon/date-fns-tz) for calculations

**Performance:**
- Virtualize event list in agenda view
- Lazy-load months as user navigates (prefetch adjacent)
- IndexedDB for offline cache
- Web worker for RRULE expansion of large recurring sets`,
    components: "CalendarShell, MonthView, WeekView, DayView, EventBlock (draggable), RRULE engine, Timezone handler, Event store (Zustand)",
    tradeoffs: ["RRULE client-side expansion (fast, can't query) vs server-side (queryable, heavy)", "Optimistic UI (responsive) vs pessimistic (accurate)"],
    crossQA: [
      { q: "How do you handle recurring events when the user edits only 'this event' vs 'this and following'?", a: "Store the edit as an exception on the RRULE rule: add EXDATE for the original occurrence, create a separate event for the edited instance (or 'this and following' splits the rule at that date). The original RRULE still generates all other occurrences. Libraries like rrule.js support this override pattern." },
      { q: "How do you detect and display overlapping events in week view?", a: "For each time column, collect all events in the day, sort by start time. Use a greedy interval graph coloring algorithm: assign each event to the lowest available column that doesn't conflict. Calculate width = 1/totalColumns, offset = column/totalColumns. This is O(n log n) and visually correct." },
      { q: "How do you sync calendar across devices in real-time?", a: "Backend exposes CalDAV or REST API. On save, server updates event and increments a sync token. Clients subscribe via SSE or WebSocket — server pushes delta (changed event IDs + sync token). Client applies delta to local store. Offline changes queued and merged on reconnect." },
      { q: "How do you implement drag-to-resize events?", a: "On mousedown on resize handle, record startY and event.end. On mousemove, compute delta in pixels, convert to time (1px = Xmin based on zoom level), snap to 15-min grid. Update event.end optimistically in state. On mouseup, persist to server. Handle edge cases: minimum duration (15min), crossing midnight." },
    ],
  },
  {
    id: "sd-comment-system",
    title: "Nested Comment System (Reddit)",
    track: "fe",
    prompt: "Design a nested comment system like Reddit. Support infinite nesting, voting, collapse threads, load-more at each level, markdown rendering.",
    requirements: [
      "Functional: Threaded comments (N levels deep), Upvote/downvote, Collapse/expand thread, Pagination per level (load more), Markdown rendering, Reply to any comment, Edit/Delete with permission",
      "Non-functional: Fast initial load (top N comments), Smooth expand/collapse, Accessible keyboard navigation",
    ],
    approach: `**Data Structure Options:**

### Adjacency List (Simple)
- Each comment: { id, parentId, content, votes, depth }
- Easy to insert; hard to fetch whole thread in one query

### Nested Set / Materialized Path
- path field: "1/4/12/47" — prefix shows all ancestors
- Fetch subtree: WHERE path LIKE '1/4/%'

### Closure Table (Best for read-heavy)
- Separate table: (ancestor, descendant, depth)
- Fetch all descendants: WHERE ancestor=42
- Complex writes but O(1) subtree queries

**Frontend Architecture:**
- CommentTree (recursive)
  - CommentNode (vote buttons, reply button, children)
  - CommentInput (markdown editor)
  - LazyChildren (load more within subtree)

**Virtualization:**
- Only top-level comments and first 3 children rendered initially
- Expand on click → fetch children
- Long threads: virtualize top-level only (variable height rows)

**Voting:**
- Optimistic update on click
- Debounce: consolidate multiple clicks before API call
- Server-side idempotent: userId + commentId → one vote record

**Markdown Rendering:**
- react-markdown with sanitization (DOMPurify)
- Lazy render markdown — plain text initially, markdown on expand or hover
- Code blocks with syntax highlighting (Prism.js)`,
    components: "CommentTree, CommentNode, LazyChildren, CommentInput (markdown), VoteButton, PaginatedLoader",
    tradeoffs: ["Adjacency list (simple writes) vs closure table (fast reads)", "Eager load all vs lazy load per level"],
    crossQA: [
      { q: "How do you render 10,000 comments without lag?", a: "Two-level virtualization: virtualize the top-level comment list (react-virtual with variable heights). Within each thread, only render first 3 nested replies — rest behind 'load more'. Collapse deeply nested threads by default. Measure actual DOM height after render for accurate virtual list positioning." },
      { q: "How do you sort comments — by time, votes, or best?", a: "Reddit's 'best' algorithm: Wilson score (lower bound of 95% confidence interval of upvote ratio). Accounts for both vote magnitude and uncertainty. Top-level comments sorted by chosen algo server-side. Within thread, always chronological for readability. Sort preference stored in URL param so it's shareable." },
      { q: "How do you implement collapsing a comment thread?", a: "Each CommentNode has local `collapsed` state. On collapse: set collapsed=true, children hidden via CSS (height:0, overflow:hidden with transition). Count hidden replies. The comment itself still visible with '[+] N replies' label. This avoids DOM unmount/remount cost — just CSS toggle." },
    ],
  },
  {
    id: "sd-image-video-upload",
    title: "Image / Video Upload Service (Frontend)",
    track: "fe",
    prompt: "Design a client-side image/video upload flow: multi-file, preview, progress, crop/resize, drag-drop, upload to S3, with failure recovery.",
    requirements: [
      "Functional: Drag & drop + click to upload, Multi-file support, Preview before upload, Crop/resize images, Progress per file, Upload to S3 (via presigned URL), Retry on failure, Cancel upload",
      "Non-functional: No page freeze during processing, Resumable large uploads, Mobile-friendly",
    ],
    approach: `**Upload Flow:**
1. User selects files → client validates (type, size)
2. Generate local preview (URL.createObjectURL)
3. Request presigned S3 URL from backend (POST /presign)
4. PUT file directly to S3 (client → S3, no server traffic)
5. On success, notify backend with the S3 key
6. Backend processes (resize, thumbnail) via Lambda trigger

**Multi-file Management:**
- File queue: array of { id, file, status, progress, error }
- Upload N files in parallel (limit concurrency to 3)
- Each upload tracked independently

**Resumable Uploads (S3 Multipart):**
1. Split large file (>5MB) into 5-10MB chunks
2. Backend creates S3 multipart upload → returns UploadId
3. Client PUTs each chunk with part number
4. On network drop: resume by checking which parts uploaded (ListParts)
5. Backend calls CompleteMultipartUpload once all parts received

**Image Processing (client-side):**
- Use OffscreenCanvas (Web Worker) for resize without blocking UI
- Crop: HTML5 Canvas crop + toBlob()
- EXIF stripping: piexifjs or canvas re-encode

**Progress Tracking:**
- XMLHttpRequest (not fetch) for onprogress event
- Alternative: fetch + ReadableStream monitoring
- Update Zustand state with progress 0-100

**Error Handling:**
- Network errors: auto-retry up to 3x with exponential backoff
- S3 errors (403 expired presign): re-request presigned URL
- UI shows retry button for user-initiated retry
- Partial uploads cleaned up by S3 lifecycle rules`,
    components: "FileDropzone, FileQueue (Zustand), PresignAPI, S3Uploader, ImageCropper (Canvas), ProgressBar, ChunkUploader",
    tradeoffs: ["Direct-to-S3 (fast, no server traffic) vs proxy-through-server (simpler auth, more control)", "Client-side resize (privacy, fast) vs server-side (consistent, no WebGL needed)"],
    crossQA: [
      { q: "Why upload directly to S3 instead of through your server?", a: "Direct S3 upload removes server as bottleneck — server doesn't touch file bytes, saving bandwidth costs and compute. Server only handles metadata (presign request, S3 key notification). S3 can handle massive parallel uploads natively. This pattern is standard at Netflix, Instagram, Dropbox." },
      { q: "How do you handle a 2GB video upload on mobile with spotty connection?", a: "S3 Multipart upload: split into 10MB chunks, upload each independently. Track uploaded chunks in localStorage. On reconnect: call S3 ListParts to see which succeeded, resume from first missing part. S3 has 7-day multipart cleanup. UI shows per-chunk progress and paused state." },
      { q: "How do you prevent uploading malicious files (disguised as images)?", a: "Client-side: check MIME type via file.type + read first 12 bytes (magic bytes) to verify true file format. Server-side: never trust client. Re-validate file type server-side via python-magic or file-type library. Run through virus scanner (ClamAV) asynchronously. Never serve uploaded files from same origin as app." },
    ],
  },
  {
    id: "sd-form-builder",
    title: "Form Builder (Drag & Drop, like Typeform)",
    track: "fe",
    prompt: "Design a drag-and-drop form builder where users can add fields (text, dropdown, checkbox, date), configure validations, preview, and share forms to collect responses.",
    requirements: [
      "Functional: Drag to add/reorder fields, Field types (short text, paragraph, number, date, dropdown, checkbox, file upload), Field settings (label, placeholder, required, validation), Preview mode, Publish & share link, Collect & export responses",
      "Non-functional: Smooth drag UX, Auto-save draft, No-code friendly UI",
    ],
    approach: `**Core Data Model:**
\`\`\`ts
type Form = {
  id: string;
  title: string;
  fields: Field[];
  settings: FormSettings;
}

type Field = {
  id: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'file';
  label: string;
  placeholder?: string;
  required: boolean;
  validation?: { min?: number; max?: number; pattern?: string; message?: string };
  options?: string[]; // for select/checkbox
}
\`\`\`

**Drag & Drop Architecture:**
- DnD Kit (dnd-kit) — headless, accessible, performant
- FormCanvas: sortable list of FieldCards
- FieldPalette: draggable field type buttons
- On drop: insert new field at dropped position

**State Management:**
- Form state in Zustand (normalized by field ID)
- Auto-save: debounce 1s after any change → PATCH /forms/:id
- Undo/redo: maintain stack of state snapshots (limit 50)

**Field Rendering (dual mode):**
- EditorMode: FieldCard with settings panel, drag handle, delete
- PreviewMode: actual form controls rendered with RHF (react-hook-form)
- Same field config drives both — single source of truth

**Form Validation Schema:**
- Transform field config → Zod/Yup schema at preview/submit time
- Real-time validation in preview mode

**Response Collection:**
- Public URL: /f/:formId — renders fill mode
- Responses stored per submission (formId → array of {fieldId: value})
- Response dashboard: table view + CSV export

**Conditional Logic:**
- Field visibility rules: show field B only if field A = 'yes'
- Stored as: { if: { fieldId, operator, value }, show: fieldId }
- Evaluated on each change in fill mode`,
    components: "FieldPalette, FormCanvas (sortable), FieldCard, FieldSettingsPanel, FormPreview (RHF), FormFill (public), ResponseDashboard",
    tradeoffs: ["Schema-driven rendering (flexible) vs component-per-type (simpler)", "Client-side validation (instant) vs server-side (authoritative)"],
    crossQA: [
      { q: "How do you design conditional logic (show field B only if field A has value X)?", a: "Store rules as: { condition: { fieldId: 'a', operator: 'equals', value: 'yes' }, action: { show: 'b' } }. Evaluate all rules on every field change using a rules engine function. Field visibility computed as derived state — never stored, always recalculated. Multiple conditions: AND/OR operators." },
      { q: "How do you handle undo/redo in the form builder?", a: "Maintain an array of state snapshots in Zustand. On every structural change (add/remove/move field), push current state to undoStack. Undo: pop from undoStack, push to redoStack, apply previous state. Redo: pop from redoStack. Limit stack to 50 entries. Debounce label edits to not flood the undo stack." },
      { q: "How do you export responses as CSV reliably?", a: "Server generates CSV: JOIN responses with form field config, output one column per field in definition order. Handle edge cases: fields added after some responses exist (empty column), option fields with comma in values (quote + escape). Stream the CSV for large response sets instead of loading all in memory." },
    ],
  },

  // ─── BE SYSTEM DESIGN (missing from Excel) ────────────────────────────────
  {
    id: "sd-instagram",
    title: "Instagram / Photo Sharing",
    track: "be",
    scale: "1B users, 100M photos/day, 4.2B likes/day",
    prompt: "Design a photo-sharing social network: upload photos, follow users, generate a feed of followed users' photos, support stories (24h expiry), likes and comments.",
    requirements: [
      "Functional: Upload photo/video, Follow/unfollow, Home feed (posts from followed users), Stories (24h), Likes & comments, Explore page, Search by hashtag/location",
      "Non-functional: Feed load <500ms, 99.99% uptime, Photo delivery via CDN, Eventual consistency OK for feed",
    ],
    scope: ["100M photo uploads/day = 1150/sec (5MB avg = 500TB/day)", "Feed generation for 1B users with avg 500 followings"],
    approach: `**Photo Upload Pipeline:**
1. Client uploads to presigned S3 URL directly
2. S3 trigger → Lambda → Media Processor (thumbnail, multiple resolutions)
3. CDN (CloudFront) cache with long TTL
4. Metadata stored in Postgres: (photoId, userId, caption, tags, location, timestamp)

**Feed Generation (Hybrid Fan-out):**
- Write path: on photo upload → Kafka event
- Fan-out service: for accounts <500K followers, push photoId to each follower's Redis feed list (LPUSH, trim to 500)
- For celebrities: fan-out on read — pull from celeb's profile at read time
- Read path: merge pre-materialized feed + celebrity posts + sponsored

**Stories:**
- Separate from photos — stored with 24h TTL in Redis + S3
- Ordering: by account, most recent first
- Viewed stories: Redis SET per user (userId → {storyId,...}) with 24h TTL

**Explore / Discovery:**
- Offline ML job (daily): compute photo embeddings, cluster by topic
- Real-time signals: trending hashtags via Kafka + Flink counting
- Elasticsearch for hashtag/location search

**Like System:**
- Likes stored in Cassandra: (photoId, userId) partition by photoId
- Count cached in Redis: INCR photo:{id}:likes
- Periodic reconciliation job syncs Redis count → Cassandra aggregate
- Notification via Kafka event → push notification service

**Database Sharding:**
- Users + followers: Postgres sharded by userId
- Photos: Cassandra partitioned by userId (profile) or photoId (global feed)
- Comments: Cassandra partitioned by photoId

**Scale:**
- 100M daily uploads → 1150/sec peak → CDN handles delivery
- Redis feed list: 1B users × 500 posts × 8B = 4TB Redis cluster
- Compression: thumbnails only in feed, full photo on click`,
    components: "Upload Service (S3), Media Processor, CDN, Feed Service (Kafka + Redis), Story Service, Like Service (Cassandra), Explore (Elasticsearch + ML), Notification",
    tradeoffs: ["Push fanout (low read latency) vs pull (low write amplification)", "Redis feed (fast) vs DB query (accurate, memory-efficient)"],
    crossQA: [
      { q: "How do you handle a celebrity with 500M followers posting a photo?", a: "Fanout-on-write for 500M users is infeasible (takes hours). For accounts above a threshold (say 1M followers): skip fanout, mark as 'celebrity'. At read time, fan-out on read: fetch the celebrity's latest posts and merge with the pre-materialized feed from non-celebrity follows. Twitter, Instagram both use this hybrid approach." },
      { q: "How do you implement Stories with 24-hour expiry reliably?", a: "Store story metadata in Redis with TTL=86400s. S3 objects have a lifecycle rule to delete after 24h. For the viewer: query Redis for active stories (TTL > 0). On client side, also filter by timestamp (client can delete from display once expired). Viewed stories tracked in a Redis SET with same 24h TTL." },
      { q: "How does the Explore page work at scale?", a: "Offline pipeline (Spark, daily): compute content embeddings for photos (ResNet features). Build user interest vector from interaction history. Candidate generation: approximate nearest neighbors (FAISS) to find photos matching user interests. Online ranking: score by freshness, engagement rate, diversity. Trending signals from real-time Kafka stream." },
      { q: "How do you handle photo deduplication (same photo uploaded multiple times)?", a: "Compute perceptual hash (pHash) of uploaded image. Check Redis/DB for existing hash. Near-duplicates detected by Hamming distance < threshold. For exact dupes: serve the existing S3 object, store only reference in user's photoset. For near-dupes: store separately but flag for moderation review (reposts)." },
    ],
  },
  {
    id: "sd-distributed-cache",
    title: "Distributed Cache (Redis-like)",
    track: "be",
    scale: "1M ops/sec, <1ms p99, terabytes of data",
    prompt: "Design a distributed in-memory cache service. Support GET/SET/DEL, TTL, eviction policies, clustering with consistent hashing, replication for availability.",
    requirements: [
      "Functional: GET/SET/DEL with O(1), TTL per key, Pub/Sub, Atomic operations (INCR, LPUSH), Persistence (RDB snapshots / AOF log), Cluster mode (auto-sharding)",
      "Non-functional: <1ms p99 latency, 99.99% availability, Horizontal scale, Cache invalidation guarantees",
    ],
    approach: `**Core Data Store:**
- In-memory hash table (dict) as primary store
- Key → {value, type, ttl, lru_clock} entry
- Types: string, list, set, sorted set, hash, bitmap

**Eviction Policies (when memory full):**
- LRU (Least Recently Used): approximate with random sampling (Redis LRU)
- LFU (Least Frequently Used): counter-based (Redis 4.0+)
- TTL-based: evict soonest-expiring keys first
- No-eviction: return OOM error

**Persistence:**
- **RDB snapshots**: fork process periodically, serialize to disk. Fast restart but data loss between snapshots.
- **AOF (Append Only File)**: write every command to log. Replay on restart. Slower but minimal data loss.
- **Hybrid**: RDB for fast restart, AOF for durability

**Clustering (Horizontal Scale):**
- Key space: 16384 hash slots (like Redis Cluster)
- Consistent hashing: slot = CRC16(key) % 16384
- Each node owns a range of slots
- MOVED redirect: if key not on this node, return redirect to correct node
- Client caches slot-to-node mapping

**Replication:**
- Primary-replica async replication
- On write to primary: immediately ACK client, async replicate to replicas
- Primary failure: replica promotes via Sentinel / Raft election
- Trade-off: possible data loss of un-replicated writes

**Pub/Sub:**
- Separate channel → subscriber list mapping
- PUBLISH sends to all subscribers synchronously
- No persistence — fire and forget

**Comparison with Memcached:**
- Redis: types, persistence, pub/sub, scripting (Lua)
- Memcached: simpler, faster pure caching, multi-threaded`,
    components: "In-memory hash table, TTL manager, Eviction policy, AOF/RDB persistence, Cluster manager (hash slots), Replication, Sentinel (HA), Pub/Sub",
    tradeoffs: ["AOF (durable) vs RDB (fast restart)", "Async replication (faster writes) vs sync (no data loss)"],
    crossQA: [
      { q: "How does Redis implement LRU eviction without maintaining a full sorted structure?", a: "Redis uses approximate LRU: each key stores a 24-bit LRU clock (seconds). On eviction needed: sample N random keys (default 5), evict the one with oldest LRU clock. With N=5 this approximates true LRU very well with O(N) instead of O(log M). Redis 4.0 added true LFU as an alternative." },
      { q: "How does consistent hashing work in a cache cluster?", a: "Map all nodes to a hash ring (0 to 2^32). Each key hashes to a point on the ring; goes to the first node clockwise. Adding a node: only the next clockwise segment redistributes (1/N of keys). Removing a node: its keys move to next node. Virtual nodes (each physical node appears K times) balance load when nodes have unequal capacity." },
      { q: "What is cache stampede / thundering herd and how do you prevent it?", a: "When a hot key expires, many requests simultaneously try to recompute it, hammering the DB. Prevention: (1) Mutex/lock: first requester gets lock, others wait for result. (2) Probabilistic early expiration (PER): slightly before TTL, probabilistically refresh — no thundering herd. (3) Jitter on TTL: randomize expiry times so not all expire simultaneously." },
    ],
  },
  {
    id: "sd-pastebin",
    title: "Pastebin / Code Snippet Sharing",
    track: "be",
    scale: "100M pastes, 500M reads/day, 10:1 read:write",
    prompt: "Design Pastebin: users paste text/code, get a short URL, share it. Support syntax highlighting, expiration, private pastes, analytics.",
    requirements: [
      "Functional: Create paste (text/code), Get shareable URL, Syntax highlighting by language, Expiration (1h/1d/1w/never), Private (password-protected), View count, Raw/download view",
      "Non-functional: Short URL (<8 chars), <100ms read latency, Scale to 10M pastes/day",
    ],
    approach: `**Short Key Generation:**
- Base62 (a-z, A-Z, 0-9): 8 chars = 218T combinations
- Option 1: Pre-generate random keys in Key Generation Service (KGS)
  - KGS maintains pool of pre-generated keys in DB
  - App server requests batch of N keys
  - Mark keys used after assignment
- Option 2: Hash content (MD5 → first 8 chars)
  - Collision possible but rare; check DB, generate new on collision

**Architecture:**
1. Client → API Server → KGS (get key) → Object Store (S3 / GCS)
2. Store paste metadata in DB: (pasteId, userId, title, lang, createdAt, expiresAt, private, viewCount)
3. Store actual content in S3 (objects can be TBs, cheaper than DB)
4. Read: API → check metadata (DB) → fetch content (S3 / cache)

**Caching:**
- Hot pastes in Redis (LRU, 24h TTL)
- Most read pastes are popular ones — 20% pastes = 80% traffic
- CDN for public pastes (long Cache-Control headers)

**Syntax Highlighting:**
- Client-side: highlight.js or Prism.js (70+ languages)
- Server-side: Pygments (for raw/download view)
- Language detected from file extension or manual selection

**Expiration:**
- Store expiresAt in DB
- Cron job (every hour) deletes expired pastes from DB + S3
- CDN edge also respects Cache-Control max-age

**Analytics:**
- View count: Redis INCR for speed, batch-write to DB every 5 min
- Geolocation + referrer logged in Kafka → ClickHouse for dashboard

**Private Pastes:**
- Optional password hash stored in DB
- Check on read: if private && !validPassword → 403`,
    components: "API Server, KGS (key pool), Object Store (S3), Metadata DB, Redis Cache, CDN, Analytics (Kafka + ClickHouse)",
    tradeoffs: ["KGS pre-generation (no collision, complex) vs hash-based (simple, collision risk)", "Store in S3 (cheap scale) vs DB blob (simpler but expensive)"],
    crossQA: [
      { q: "Why store paste content in S3 instead of the database?", a: "Paste content can be arbitrary size (up to MBs). DB stores content as BLOBs — expensive, wastes row space, slow for large reads. S3 is designed for object storage: TB-scale, cheap egress, direct streaming. DB stores only metadata (pasteId, userId, s3Key, lang, ttl) — fast indexed queries. S3 content served via CDN for popular pastes." },
      { q: "How do you handle expiration of millions of pastes?", a: "Multiple strategies: (1) Lazy delete: check expiresAt on every read, return 410 Gone if expired. (2) Cron job: scan DB for expired pastes hourly, batch delete S3 objects + DB rows. (3) S3 lifecycle rules: auto-delete S3 objects after X days. Combine: S3 lifecycle for storage cleanup, lazy check for API correctness." },
      { q: "How would you implement a fork/clone feature like GitHub Gists?", a: "Store parent pasteId in the paste metadata. Fork creates new paste with same content + parentId reference. S3 deduplication: if content identical, point to same S3 key (save storage). Fork tree: query WHERE parentId=X. History view: show all forks. Private paste cannot be forked by non-owners." },
    ],
  },
  {
    id: "sd-logging-monitoring",
    title: "Distributed Logging & Monitoring System",
    track: "be",
    scale: "100K services, 1B log lines/day, sub-minute alerting",
    prompt: "Design a centralized logging and monitoring platform (like Datadog/ELK). Collect logs/metrics/traces from thousands of services, index for search, alert on anomalies.",
    requirements: [
      "Functional: Log ingestion from services (structured JSON), Full-text search across logs, Metrics collection (counters, gauges, histograms), Distributed tracing (trace_id correlation), Dashboards and alerting, Retention policies",
      "Non-functional: Ingest 1M events/sec, Search results <5s, Alert within 1 minute, Never drop critical logs",
    ],
    approach: `**Three Pillars: Logs, Metrics, Traces**

### Logs Pipeline
1. Service → Agent (Fluentd/Filebeat) → Kafka (buffer)
2. Log Processor (Flink): parse, enrich, index
3. Elasticsearch for search/aggregation
4. Cold storage: S3 (Parquet/compressed) for long-term retention

### Metrics Pipeline
1. Services expose Prometheus /metrics endpoint
2. Prometheus scrapes every 15s (pull model)
3. Long-term storage: Thanos / Cortex / InfluxDB (push to remote write)
4. Query: PromQL

### Distributed Tracing
1. SDK in each service: generate trace_id on request entry, propagate via HTTP headers (W3C TraceContext standard)
2. Each service emits spans: { traceId, spanId, parentSpanId, operation, duration, tags }
3. Jaeger / Zipkin collects and stitches spans into trace waterfall
4. Trace stored sampled (1-10% by default, 100% on error)

### Alerting
- Prometheus Alertmanager: PromQL rules → if condition true for N minutes → fire alert
- Elasticsearch Watcher: log-based alerts (error rate > X%)
- On-call routing: PagerDuty / OpsGenie integration
- Alert fatigue prevention: de-duplication, cool-down periods, severity levels

### Log Retention
- Hot: 7 days in ES (fast search)
- Warm: 30 days compressed in ES (slower)
- Cold: 1 year in S3 Parquet (Athena for adhoc query)
- Compliance: audit logs retained 7 years

### Scale Patterns
- Kafka as buffer prevents ingestion spikes from crashing ES
- ES index per day/week (easy retention management)
- Sampling: trace every request is expensive — sample 1% normally, 100% on errors`,
    components: "Log Agent (Fluentd), Kafka, Elasticsearch, Flink (processing), Prometheus, Thanos, Jaeger (tracing), Alertmanager, S3 (cold storage), Grafana (dashboards)",
    tradeoffs: ["Pull (Prometheus) vs push (StatsD) for metrics", "Full sampling vs tail-based sampling for traces", "Hot/warm/cold tiering vs single store"],
    crossQA: [
      { q: "How does distributed tracing work across microservices?", a: "First service generates trace_id (UUID) and span_id on incoming request. Passes both in outbound HTTP headers (W3C traceparent). Each downstream service reads headers, creates child span with same trace_id + new span_id, sets parentSpanId = received span_id. Spans shipped to Jaeger asynchronously. Jaeger stitches by trace_id to show full waterfall timeline." },
      { q: "How do you prevent log ingestion from overwhelming Elasticsearch?", a: "Kafka as buffer between agents and ES. Log processors (Flink) in between can: rate limit ingestion, drop debug logs during high load, compress/batch writes. ES index lifecycle management (ILM) auto-rolls indices. Hot-warm-cold tiers: hot nodes (SSD, 7 days), warm nodes (HDD, 30 days), cold tier (S3 via searchable snapshots)." },
      { q: "How do you correlate logs across services for a single request?", a: "Trace ID propagation: same trace_id injected in HTTP headers flows through all service calls. Each service logs requests with trace_id. To debug: search logs WHERE trace_id='abc123' in Elasticsearch — see all log lines from all services for that request in chronological order. Correlation fields: trace_id, user_id, request_id." },
    ],
  },
  {
    id: "sd-food-delivery",
    title: "Food Delivery Platform (Swiggy / Zomato)",
    track: "be",
    scale: "10M orders/day, 500K concurrent users, real-time tracking",
    prompt: "Design a food delivery platform: browse restaurants, place order, real-time delivery tracking, payments, driver assignment, ETA calculation.",
    requirements: [
      "Functional: Browse restaurants/menu by location, Add to cart, Place order, Payment, Driver assignment (nearest driver), Real-time order tracking on map, ETA, Rating & reviews, Order history",
      "Non-functional: Order confirmed <2s, Driver assigned <30s, Location update latency <3s, Handle 10x spike during lunch/dinner",
    ],
    approach: `**Core Services:**
1. **Restaurant Service**: catalog, menus, availability (Postgres + Redis cache)
2. **Order Service**: order lifecycle (Postgres, ACID)
3. **Cart Service**: Redis (TTL 30min), merge on login
4. **Driver Service**: location, availability, assignment
5. **Tracking Service**: real-time location streaming
6. **Payment Service**: Razorpay/Stripe integration
7. **Notification Service**: push/SMS for all parties
8. **ETA Service**: ML model + routing API (Google Maps)

**Restaurant Discovery:**
- Geohash of user location → query restaurants within 8km radius
- Filter: rating, cuisine, delivery time, offers
- Elasticsearch for text search (restaurant/dish name)
- Menu cached in Redis (invalidate on update)

**Driver Assignment:**
- Drivers post location via WebSocket every 3s
- Redis GEO stores driver locations
- On new order: GEORADIUS query → available drivers within 3km
- Broadcast order offer to top 3 drivers, first to accept wins
- If no driver in 3min: expand radius to 5km, notify restaurant

**Real-time Tracking:**
- Driver app → Location Service (WebSocket) → Redis Pub/Sub → Customer WebSocket
- Event: { driverId, orderId, lat, lng, timestamp }
- Customer subscribes to channel order:{orderId}:location
- ETA recalculated every 30s based on current position + Google Maps API

**Order State Machine:**
PLACED → RESTAURANT_CONFIRMED → DRIVER_ASSIGNED → PICKED_UP → DELIVERED (or CANCELLED at any point)
Each transition: Kafka event → update DB → push notification

**Handling Lunch Spike:**
- Restaurant catalog: CDN-cached (changes infrequently)
- Driver location: Redis (in-memory, handles millions of ops/sec)
- Order processing: horizontal scaling + queue-based (Kafka) to absorb burst
- Surge pricing when driver supply low

**Data Modeling:**
- Orders: Postgres (ACID for money/state), sharded by orderId
- Driver locations: Redis (ephemeral, fast)
- Analytics: ClickHouse (delivery time, revenue by area)`,
    components: "Restaurant Service, Order Service (Kafka + Postgres), Cart (Redis), Driver Service (Redis GEO), Tracking (WebSocket + Pub/Sub), Payment, ETA (ML + Maps), Notification",
    tradeoffs: ["Driver assignment: broadcast offer (faster acceptance) vs sequential assignment (fair)", "ETA: Google Maps API (accurate, cost) vs in-house routing (cheaper, complex)"],
    crossQA: [
      { q: "How do you handle an order where the restaurant is slow to confirm?", a: "Order enters PLACED state. Restaurant has 3 minutes to confirm via app. If no confirmation: auto-cancel, notify user, refund. System also sends push notification + SMS to restaurant. Second attempt: call restaurant phone via automated IVR. After timeout: mark restaurant as 'slow response', factor into ranking." },
      { q: "How do you calculate accurate delivery ETAs?", a: "Multi-factor: (1) Restaurant prep time: ML model trained on historical prep times per restaurant/dish/time-of-day. (2) Driver pickup ETA: current driver location → restaurant via routing API. (3) Delivery ETA: restaurant → customer via routing API adjusted for traffic. Sum + buffer (10%). Recalculate every 30s as driver moves." },
      { q: "How does the cart work across devices and sessions?", a: "Anonymous cart: stored in Redis with TTL=30min, keyed by session cookie. On login: merge server cart with any existing saved cart (union of items, resolve conflicts by taking higher quantity). Logged-in cart: Redis keyed by userId with longer TTL (7 days). Cart items reference restaurantId — validate on checkout that restaurant still open and prices unchanged." },
    ],
  },
  {
    id: "sd-distributed-locking",
    title: "Distributed Locking Service",
    track: "be",
    scale: "100K concurrent lock requests, <5ms latency, fault-tolerant",
    prompt: "Design a distributed locking service that prevents concurrent access to shared resources across multiple servers. Support TTL, reentrant locks, fairness.",
    requirements: [
      "Functional: Acquire lock (blocking + non-blocking), Release lock, TTL (auto-release on crash), Reentrant locks (same client re-acquires), Lock owner validation, Fairness (FIFO queue optional)",
      "Non-functional: <5ms latency, No deadlocks, Handle node failures, Correct under network partitions",
    ],
    approach: `**Option 1: Redis-based (Redlock)**
\`\`\`
// Acquire
SET resource_lock {clientId + requestId} NX EX {ttl_seconds}
// NX = only if not exists, EX = auto-expire

// Release (Lua script — atomic check-and-delete)
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else return 0 end
\`\`\`

**Redlock (multi-node):**
- Acquire lock on N/2+1 independent Redis nodes within ttl/2 time
- If quorum acquired: lock held
- Release on all N nodes (even failed ones, when they recover)
- Pros: simple. Cons: Martin Kleppmann's critique — clock skew can cause dual leadership

**Option 2: ZooKeeper (Consensus-based)**
- Create ephemeral sequential znode: /locks/resource-0001
- Watch the znode with next lower sequence number
- Lock acquired when you hold the lowest sequence
- Node crash: ephemeral znode auto-deleted → next in line acquires
- Pros: correct under failures. Cons: higher latency (Paxos round-trips)

**Option 3: etcd (Raft-based)**
- etcd uses Raft consensus — linearizable reads/writes
- Create key with lease (TTL): Grant lease, Put key with lease ID
- Lease keepalive: client sends heartbeat every lease_ttl/3 seconds
- Client crash → lease expires → key deleted → others can acquire
- Recommended for correctness-critical systems

**Reentrant Locks:**
- Store owner as {clientId, depth} in lock value
- On re-acquire: if owner matches clientId, increment depth
- On release: decrement depth; delete key only when depth=0

**Deadlock Prevention:**
- Always use TTL — no indefinite locks
- Lock ordering convention (client acquires locks in consistent order)
- Timeout on acquire (don't wait forever)
- Monitoring: alert on locks held > 2×TTL`,
    components: "Lock Service (Redis/etcd/ZooKeeper), Lease Manager, Lock Monitor, Client SDK (with retry/backoff)",
    tradeoffs: ["Redis (fast, simple, not CP) vs ZooKeeper (correct, slower) vs etcd (balanced)", "TTL accuracy depends on clock sync — use conservative TTL"],
    crossQA: [
      { q: "What's wrong with using a single Redis instance for distributed locking?", a: "Single Redis is not fault-tolerant: if master fails before replication, lock state is lost. Failover promotes a replica that doesn't know about the lock — two clients can both think they hold the lock. Redlock mitigates by requiring quorum across N independent instances, but Martin Kleppmann argues even Redlock isn't safe under clock drift and GC pauses." },
      { q: "How do you prevent a lock from being held forever if the client crashes?", a: "TTL (lease) on every lock. Client must acquire lock with NX EX 30 (expires in 30s). Client sends keepalive heartbeats every 10s to extend lease. If client crashes, heartbeats stop, lease expires, lock auto-released. Client must complete critical section within one TTL, or implement lease renewal with a background goroutine/thread." },
      { q: "How do you implement a fair lock (FIFO — first to wait, first to acquire)?", a: "ZooKeeper sequential ephemeral znodes naturally implement FIFO: each waiter creates /lock/resource-SEQ, watches the znode with SEQ-1. When SEQ-1 is deleted, next in line acquires. With Redis: maintain a sorted set as wait queue (ZADD with timestamp as score). Lock holder picks next from queue on release. More complex but fair." },
    ],
  },
  {
    id: "sd-cdn",
    title: "Content Delivery Network (CDN)",
    track: "be",
    scale: "10M requests/sec globally, <50ms latency worldwide, exabytes of content",
    prompt: "Design a CDN that caches content at globally distributed edge nodes, routes users to nearest edge, handles cache invalidation, supports HTTPS, and streams video.",
    requirements: [
      "Functional: Cache static assets (images, JS, CSS, video chunks), Route user to nearest PoP (Point of Presence), Cache invalidation (by URL, by tag), HTTPS at edge, Origin shield, Video streaming (range requests)",
      "Non-functional: <50ms globally, 99.99% availability, Handle 10M req/sec, Efficient origin pull",
    ],
    approach: `**Core Architecture:**
- **Edge nodes (PoPs)**: 100s of locations globally (Cloudflare has 300+). Each PoP has: cache (disk + memory), reverse proxy (Nginx/custom), TLS termination, health checker.
- **Origin shield**: intermediate caching layer between edge and origin — collapses many edge cache misses into single origin request.
- **Control plane**: global config distribution, cache invalidation propagation, certificate management (Let's Encrypt ACME).

**Request Routing:**
- **Anycast DNS**: CDN's name servers return same IP for all regions, BGP routing selects nearest edge.
- **GeoDNS**: Different IP per region. User's DNS resolver location determines edge assignment.
- **Latency-based routing**: periodic RTT probes to measure actual latency, route to lowest-latency PoP.

**Cache Architecture at Edge:**
- L1: In-memory (hot assets, last 1 hour)
- L2: Local SSD (warm assets, last 7 days)
- On miss: check Origin Shield → if miss there → pull from origin
- Cache key: URL + Vary headers (Accept-Encoding, Accept-Language)

**Cache-Control Headers:**
- max-age=31536000, immutable: static assets with content hash in URL (never invalidate)
- max-age=300, stale-while-revalidate=60: pages that change
- no-store: private/personalized content — never cache

**Cache Invalidation:**
- URL-based: purge specific URL from all PoPs (propagated via control plane)
- Tag-based: add Cache-Tag: product-123 header → purge all URLs with that tag
- Soft purge: mark stale but serve stale while fetching fresh (avoids thundering herd)

**Video Streaming:**
- Video chunked into 2-10s segments (HLS/DASH)
- Each segment independently cached by URL
- Range requests: CDN passes byte-range to origin, caches full segment
- Origin shield critical: segment cache miss would otherwise hit origin for every edge

**TLS at Edge:**
- Certificates stored at edge (Let's Encrypt via ACME)
- TLS termination at edge — HTTP to origin (or mTLS)
- OCSP stapling for fast certificate validation
- HTTP/2 or HTTP/3 (QUIC) between client and edge`,
    components: "DNS (Anycast/GeoDNS), Edge PoPs (Nginx + cache), Origin Shield, Control Plane (config/invalidation), TLS termination, Health monitoring",
    tradeoffs: ["Cache longer (better performance, stale risk) vs shorter (fresh, more origin load)", "Anycast (simpler) vs GeoDNS (more control)"],
    crossQA: [
      { q: "How does CDN cache invalidation propagate to all edge nodes quickly?", a: "Control plane maintains persistent connections to all edge nodes. On purge request: API → control plane → broadcast to all PoPs via message bus (Kafka or internal pub/sub). Edge nodes receive invalidation, mark URLs as expired, serve stale meanwhile (soft purge). Full propagation in <5s across 300 PoPs. Immediate hard purge available for critical removals." },
      { q: "How does Anycast routing work to direct users to nearest CDN edge?", a: "CDN announces the same IP block from all PoPs via BGP. When user's packet reaches internet backbone, BGP selects the shortest path (fewest AS hops) to that IP — which corresponds to the nearest PoP. No DNS round-trip needed. Pros: automatic failover (if one PoP drops, BGP re-converges). Cons: BGP hops ≠ physical distance." },
      { q: "How would you handle a cache miss storm when a PoP restarts cold?", a: "Origin shield: all edge misses first go to regional shield node (one per continent). Shield has warm cache, so only 1 origin request per unique URL. On PoP restart: requests route to shield (or origin) temporarily. Thundering herd mitigation: request coalescing — multiple simultaneous misses for same URL → one origin request, others wait and share the response." },
    ],
  },
  {
    id: "sd-cron-scheduler",
    title: "Distributed Cron Job Scheduler",
    track: "be",
    scale: "100M scheduled jobs, 10K jobs/sec at peak, exactly-once execution",
    prompt: "Design a distributed cron job scheduler: users define jobs with cron expressions, system executes them reliably at the right time, supports retries, logs, and monitoring.",
    requirements: [
      "Functional: Schedule job with cron expression or one-time timestamp, HTTP/webhook job type, Job retries with backoff, Job history & logs, Pause/resume/delete jobs, Monitoring dashboard",
      "Non-functional: Exactly-once execution (no duplicate runs), <1s trigger latency, Fault-tolerant (node failure shouldn't miss jobs), Handle 10K concurrent job executions",
    ],
    approach: `**Core Challenge:** Distributed, fault-tolerant, exactly-once scheduling

**Architecture Components:**
1. **Scheduler Store**: Postgres with jobs table + next_run_at index
2. **Scheduler Service**: polls for due jobs, acquires locks, dispatches
3. **Job Queue**: Kafka or RabbitMQ for job dispatch
4. **Worker Pool**: executes jobs (HTTP calls, scripts)
5. **Job History DB**: Cassandra/Postgres for execution logs

**Job Table Schema:**
\`\`\`sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY,
  cron_expr VARCHAR(100),    -- "0 9 * * 1-5"
  next_run_at TIMESTAMPTZ NOT NULL,
  status ENUM('active','paused','deleted'),
  last_run_at TIMESTAMPTZ,
  retry_config JSONB,        -- {maxAttempts: 3, backoff: 'exponential'}
  job_config JSONB,          -- {type: 'http', url: '...', headers: {...}}
);
CREATE INDEX idx_next_run ON jobs (next_run_at) WHERE status='active';
\`\`\`

**Scheduling Loop:**
1. Every second: SELECT * FROM jobs WHERE next_run_at <= NOW() AND status='active' LIMIT 1000
2. For each due job: acquire distributed lock (Postgres advisory lock or Redis NX)
3. Dispatch to Kafka (job_id, execution_id, config)
4. Update next_run_at = compute_next(cron_expr, NOW())

**Exactly-Once with Idempotency:**
- Each trigger creates execution_id (UUID)
- Worker uses execution_id as idempotency key
- Check execution_history before processing: if already processed, skip
- Atomic DB update: INSERT INTO executions WHERE NOT EXISTS (same job_id + scheduled_at)

**Worker Execution:**
- Workers consume from Kafka (consumer group)
- Execute job (HTTP POST, script, etc.)
- On success: write execution log (status=success, duration)
- On failure: retry with exponential backoff (1s, 4s, 16s)
- Exhausted retries: status=failed, alert via notification service

**High Availability:**
- Multiple scheduler instances run — use leader election (ZooKeeper/etcd)
- Only leader polls DB and dispatches; followers ready for takeover
- Alternative: sharding jobs across scheduler instances by job_id hash

**Handling Missed Jobs (after outage):**
- On restart: query jobs WHERE next_run_at < NOW() AND status='active'
- Policy: run_missed=true → execute missed run immediately, then schedule next
- Or: run_missed=false → skip missed, schedule next normally (user configures per job)`,
    components: "Jobs DB (Postgres), Scheduler Service (leader election), Job Queue (Kafka), Worker Pool, Execution History, Monitoring Dashboard",
    tradeoffs: ["Leader election (simple, single point) vs sharded scheduling (complex, more throughput)", "Run missed jobs (accurate history) vs skip (simpler, avoid cascading runs)"],
    crossQA: [
      { q: "How do you guarantee exactly-once execution across scheduler instances?", a: "Two-phase: (1) Scheduler acquires distributed lock per job before dispatching (Postgres advisory lock: SELECT pg_try_advisory_lock(job_id)). Only one scheduler claims the job. (2) Worker uses execution_id (job_id + scheduled_timestamp as idempotency key). Before executing: INSERT INTO executions ON CONFLICT DO NOTHING — check if 0 rows inserted (already claimed). This prevents duplicates even on crash-after-dispatch." },
      { q: "How do you compute the next run time for a cron expression?", a: "Use a cron parsing library (cron-parser in Node, croniter in Python). Parse expression, get iterator starting from current time, call next() to get next scheduled time. Store in next_run_at. After job runs: call next() again from run time to compute subsequent next_run_at. Handle DST transitions: use UTC internally, display in user's timezone." },
      { q: "How do you handle a backlog of 10,000 jobs all scheduled for exactly 9:00am?", a: "Burst: Kafka absorbs the spike, Kafka consumer lag grows but no jobs dropped. Worker pool autoscales (Kubernetes HPA on queue depth metric). Jobs processed in ~1-5 min depending on pool size. For predictable bursts: pre-warm workers 2 min before known busy times. Stagger similar jobs via cron jitter (CRON_TZ randomized offsets)." },
    ],
  },
  {
    id: "sd-task-scheduler",
    title: "Distributed Task Scheduler (Celery / Temporal-like)",
    track: "be",
    scale: "1M tasks/day, retry logic, workflow orchestration, monitoring",
    prompt: "Design a distributed task scheduling and workflow orchestration system. Support async task execution, retries, DAG-based workflows, priority queues, and observability.",
    requirements: [
      "Functional: Submit tasks (single + batches), Priority queues, Retries with backoff, Task dependencies (DAG workflows), Task result storage, Cancel/pause tasks, Monitoring dashboard",
      "Non-functional: At-least-once execution, Task deduplication, Fault tolerant (worker crash doesn't lose task), Sub-second scheduling latency",
    ],
    approach: `**Task Queue Architecture:**

### Single Task Execution
1. Producer submits task → API → Task Queue (Kafka/Redis/RabbitMQ)
2. Worker pulls task, executes, reports result
3. Result stored in KV (Redis TTL=24h or Postgres)
4. Failure: re-queued (with backoff) or dead-letter queue

### Priority Queues
- Separate Kafka topics per priority (critical, high, normal, low)
- Workers consume in priority order: drain critical before high, etc.
- Alternative: single queue with priority field + priority-aware scheduler in front

### DAG Workflow (Temporal / Airflow model)
\`\`\`
WorkflowDefinition:
  tasks:
    - id: fetch_data
      type: http_call
      config: {url: ...}
    - id: process_data
      depends_on: [fetch_data]
      type: compute
    - id: send_email
      depends_on: [process_data]
      type: email
\`\`\`
- Orchestrator executes DAG: start tasks with no dependencies
- On task completion: check if dependents ready (all deps done)
- State machine per workflow stored in DB

### Temporal Architecture (Event Sourcing Approach)
- Worker executes workflow code deterministically
- Every state change is an event (written to durable log)
- On worker crash: replay event log → restore workflow state exactly
- Enables: long-running workflows (days/months), timer support, saga compensation

**Deduplication:**
- Task submission includes idempotency_key
- Dedup window: Redis SET NX {idempotency_key} EX 24h
- Duplicate submissions return existing task status

**Dead Letter Queue:**
- After maxRetries exhausted: move to DLQ topic
- DLQ processor: alert on-call + store for manual inspection/retry
- Dashboard shows DLQ depth as key metric

**Observability:**
- Task lifecycle events → Kafka → ClickHouse
- Metrics: throughput, p99 latency, error rate, DLQ depth
- Distributed tracing: each task carries trace_id
- Dashboard: Grafana on top of Prometheus metrics`,
    components: "API (task submission), Priority Queue (Kafka topics), Worker Pool, Orchestrator (DAG engine), Result Store (Redis + Postgres), DLQ, Monitoring (Prometheus + Grafana)",
    tradeoffs: ["At-least-once (simple, dedup needed) vs exactly-once (complex, Kafka transactions)", "Pull model (worker controls load) vs push model (broker pushes, simpler)"],
    crossQA: [
      { q: "How does Temporal guarantee workflow execution survives worker crashes?", a: "Temporal uses event sourcing: every workflow state transition is appended to a durable history log (SQL DB). Worker executes workflow code deterministically. On crash: new worker picks up task, replays history log from start — re-runs all events deterministically to restore exact state without side effects (SDK mocks completed activities). Workflow resumes from where crash happened." },
      { q: "How do you implement retry with exponential backoff?", a: "Task record stores attempt_count and next_retry_at. On failure: increment attempt_count, compute next_retry_at = NOW() + base_delay × 2^(attempt_count-1) + jitter. Update task status to 'retrying'. Scheduler picks tasks WHERE next_retry_at <= NOW(). Jitter prevents thundering herd on shared dependency failures. Max delay capped (e.g., 1 hour)." },
      { q: "How do you handle long-running tasks that take hours?", a: "Worker sends periodic heartbeats to scheduler (every 30s). Scheduler marks task 'stale' if no heartbeat for 2× heartbeat interval, re-queues for another worker. Worker checkpoint: periodically save progress to DB, resume from checkpoint on retry (avoids re-doing completed work). For very long jobs (days): Temporal timers — scheduler wakes workflow after N hours without blocking a thread." },
    ],
  },
];
