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
    id: "sd-notification",
    title: "Notification System",
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
