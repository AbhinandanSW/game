// Comprehensive Frontend concepts — JS, React, CSS, Performance, Tooling, A11y, TS, Advanced
// Every concept has a deep-dive `detail` field with code examples and diagrams.

export const CONCEPTS_FE = [
  // ─── JavaScript ─────────────────────────────────────────
  {
    id: "fe-event-loop",
    cat: "JavaScript",
    n: "Event Loop",
    s: "Single-threaded runtime using call stack + task queues.",
    depth: "deep",
    level: "L1",
    detail: `## The JavaScript Event Loop

JavaScript is **single-threaded** but handles async via the event loop:
- **Call Stack** — function frames
- **Web APIs** — setTimeout, fetch, DOM events (run in browser)
- **Macrotask Queue** — setTimeout, setInterval, I/O, UI events
- **Microtask Queue** — Promise.then, queueMicrotask, MutationObserver

![Event Loop](https://mdn.github.io/shared-assets/images/diagrams/javascript/event-loop.svg)

### Execution Order
1. Run sync code (call stack)
2. After stack empties, drain ALL microtasks
3. Run ONE macrotask
4. Drain microtasks again
5. Render (browser)
6. Repeat

### Example
\`\`\`js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// Output: 1, 4, 3, 2
\`\`\`

### Common Pitfalls
- Long sync code blocks UI (browser can't render)
- Infinite microtasks starve macrotasks (\`Promise.resolve().then(loop)\`)
- \`setTimeout(fn, 0)\` is clamped to 4ms minimum
- \`requestAnimationFrame\` runs before render (60fps)

### Node.js Differences
Phases: timers → pending → poll → check (setImmediate) → close. Microtasks drain between each phase.`,
  },
  {
    id: "fe-closures",
    cat: "JavaScript",
    n: "Closures",
    s: "Function retaining lexical scope after outer returns.",
    depth: "deep",
    level: "L1",
    detail: `## Closures

A closure = function + its lexical environment. The function "remembers" variables from where it was defined.

\`\`\`js
function makeCounter() {
  let count = 0;
  return {
    inc: () => ++count,
    get: () => count,
  };
}
const c = makeCounter();
c.inc(); c.inc(); // count is 2, private
\`\`\`

### Use Cases
- **Data privacy** (module pattern)
- **Memoization** — cache inside closure
- **Partial application** — bind, currying
- **Callbacks** — setTimeout, handlers remember context

### Classic Gotcha
\`\`\`js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 3, 3, 3 (shared i)

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// Output: 0, 1, 2 (new binding per iteration)
\`\`\`

### Memory
Closures retain references → large objects won't GC. Common memory leak source in event handlers.`,
  },
  {
    id: "fe-prototypes",
    cat: "JavaScript",
    n: "Prototypal Inheritance",
    s: "Objects inherit via __proto__ chain.",
    depth: "deep",
    level: "L1",
    detail: `## Prototypal Inheritance

Every object has \`[[Prototype]]\` pointing to another object. Property lookup walks this chain.

\`\`\`js
const animal = { eats: true };
const rabbit = { jumps: true };
Object.setPrototypeOf(rabbit, animal);
rabbit.jumps; // true (own)
rabbit.eats;  // true (inherited)
\`\`\`

### \`prototype\` vs \`__proto__\`
- \`Constructor.prototype\` — what \`new Constructor()\` uses as \`__proto__\`
- \`instance.__proto__\` — the actual prototype

\`\`\`js
function Person(name) { this.name = name; }
Person.prototype.greet = function() { return 'Hi ' + this.name; };
const p = new Person('Alex');
p.__proto__ === Person.prototype; // true
\`\`\`

### ES6 Classes = Syntactic Sugar
\`\`\`js
class Animal {
  constructor(name) { this.name = name; }
  eat() { return this.name + ' eats'; }
}
class Dog extends Animal {
  bark() { return 'woof'; }
}
// dog.__proto__ → Dog.prototype → Animal.prototype → Object.prototype → null
\`\`\`

Methods on prototype = shared (memory efficient).
Properties on instance = per-object.`,
  },
  {
    id: "fe-this",
    cat: "JavaScript",
    n: "this Keyword",
    s: "Determined by call-site: 4 rules + arrow fn.",
    depth: "deep",
    level: "L1",
    detail: `## The \`this\` Keyword

\`this\` is determined by **how a function is called**, not where it's defined.

### Priority Order
1. **new** — \`new Foo()\` → this = newly created object
2. **Explicit** — \`fn.call(obj)\`, \`fn.apply\`, \`fn.bind\` → this = obj
3. **Implicit** — \`obj.method()\` → this = obj
4. **Default** — bare \`fn()\` → globalThis (undefined in strict)
5. **Arrow fns** — no own this, lexical (enclosing scope)

\`\`\`js
const obj = { name: 'A', greet() { return this.name; } };
obj.greet();                  // 'A' (implicit)
const g = obj.greet;
g();                          // undefined (default)
g.call(obj);                  // 'A' (explicit)
\`\`\`

### Common Pitfall
\`\`\`js
setTimeout(obj.method);       // loses this
setTimeout(() => obj.method()); // fixed
obj.method.bind(obj);          // also fixed
\`\`\``,
  },
  {
    id: "fe-promises",
    cat: "JavaScript",
    n: "Promises & async/await",
    s: "Microtask-based async; async/await is syntactic sugar.",
    depth: "deep",
    level: "L1",
    detail: `## Promises

A Promise represents an eventual value. Three states: **pending**, **fulfilled**, **rejected**.

\`\`\`js
const p = new Promise((resolve, reject) => {
  setTimeout(() => resolve(42), 1000);
});
p.then(v => console.log(v)); // 42
\`\`\`

### Chaining
\`.then\` returns a new Promise — enables chaining. Thrown errors bubble to next \`.catch\`.
\`\`\`js
fetch('/api')
  .then(r => r.json())
  .then(data => process(data))
  .catch(err => console.error(err))
  .finally(() => setLoading(false));
\`\`\`

### async/await
Syntactic sugar on Promises. Feels synchronous but is async.
\`\`\`js
async function load() {
  try {
    const r = await fetch('/api');
    const data = await r.json();
    return process(data);
  } catch (e) { console.error(e); }
}
\`\`\`

### Parallel vs Sequential
\`\`\`js
// Sequential (slow, total = a + b)
const x = await fetchA();
const y = await fetchB();

// Parallel (fast, total = max(a, b))
const [x, y] = await Promise.all([fetchA(), fetchB()]);
\`\`\`

### Promise Combinators
- \`Promise.all\` — all resolve, or first reject
- \`Promise.allSettled\` — all resolve or reject, never rejects
- \`Promise.race\` — first to settle wins
- \`Promise.any\` — first to fulfill (ignores rejects)

### Error Handling
Unhandled rejections crash Node; browsers fire \`unhandledrejection\` event. Always \`.catch\` or \`try/await\`.`,
  },
  {
    id: "fe-es6plus",
    cat: "JavaScript",
    n: "ES6+ Features (Generators, Proxy, Reflect, Symbols)",
    s: "Iterators, meta-programming, weak collections.",
    depth: "medium",
    level: "L2",
    detail: `## Generators
Pausable functions using \`yield\`. Basis for async iteration.
\`\`\`js
function* range(n) {
  for (let i = 0; i < n; i++) yield i;
}
for (const v of range(3)) console.log(v); // 0, 1, 2
\`\`\`

## Symbols
Unique, immutable primitives. Used as object keys to avoid collisions.
\`\`\`js
const id = Symbol('id');
obj[id] = 123;  // Won't collide with any other 'id' key
\`\`\`
Well-known: \`Symbol.iterator\`, \`Symbol.asyncIterator\`, \`Symbol.toPrimitive\`.

## Proxy & Reflect
Intercept object operations — meta-programming.
\`\`\`js
const handler = {
  get(target, prop) {
    console.log('Read', prop);
    return Reflect.get(target, prop);
  },
  set(target, prop, value) {
    if (typeof value !== 'number') throw new TypeError();
    return Reflect.set(target, prop, value);
  }
};
const p = new Proxy({}, handler);
p.count = 5;  // Validated
\`\`\`
Used by: Vue 3 reactivity, Immer, MobX.

## WeakMap / WeakSet
- Keys are weakly held (garbage collected)
- Can't enumerate keys
- Use case: associate metadata with objects without preventing GC

\`\`\`js
const wm = new WeakMap();
let obj = {};
wm.set(obj, 'secret');
obj = null; // Entry garbage collected
\`\`\``,
  },

  // ─── React ──────────────────────────────────────────────
  {
    id: "fe-vdom",
    cat: "React",
    n: "Virtual DOM & Reconciliation",
    s: "In-memory tree + diff to minimize real DOM writes.",
    depth: "deep",
    level: "L2",
    detail: `## Virtual DOM & Reconciliation

Real DOM ops are expensive (layout, paint). React keeps an in-memory tree, diffs old vs new, applies minimal changes.

### Heuristics (O(n), not O(n³))
1. **Different types** → full rebuild (\`<div>\` → \`<span>\`)
2. **Same type** → compare props, recurse on children
3. **Keys on lists** — match by key, not position

### Fiber (React 16+)
- Work split into units (fibers)
- Interruptible — pause/resume/prioritize
- Two phases:
  - **Render** (pausable): build new tree, diff
  - **Commit** (sync): apply to DOM

![React Fiber](https://github.com/acdlite/react-fiber-architecture/raw/master/assets/fiber.png)

### Keys — Critical for Lists
\`\`\`jsx
// Bad — breaks on reorder/insert
{items.map((it, i) => <Row key={i} />)}

// Good — stable identity
{items.map(it => <Row key={it.id} />)}
\`\`\`

### What Triggers Re-render
- \`setState\` / \`useState\`
- Parent re-rendered (unless memoized)
- Context value changed (re-renders ALL consumers — no selector)

### Avoiding Unnecessary Renders
- \`React.memo\` — skip if props shallow-equal
- \`useMemo\` — cache expensive value
- \`useCallback\` — stable function ref`,
  },
  {
    id: "fe-hooks",
    cat: "React",
    n: "Hooks Internals",
    s: "Linked list attached to fiber; order matters.",
    depth: "deep",
    level: "L2",
    detail: `## How Hooks Work

Each fiber (component instance) has a linked list of hook state. Hooks are called in order — React increments an index each call.

\`\`\`js
// Pseudo-code of React's internal representation
fiber.hooks = [
  { state: 0, queue: [] },      // useState(0)
  { deps: [a, b], cleanup: ... }, // useEffect
  { value: memoized },           // useMemo
];
\`\`\`

### Rules of Hooks (not arbitrary — required)
1. Only call at **top level** (not in conditions/loops)
2. Only call from **React functions** (components or other hooks)

Why? React uses call order to match hooks to slots. Conditional calls would desync the list.

\`\`\`js
// BROKEN
if (cond) useState(0);  // First render: 1 hook; Next: 0 hooks → crash

// FIX
const [x, setX] = useState(0);
if (cond) { /* use x */ }
\`\`\`

### useState Under the Hood
\`\`\`js
function useState(initial) {
  const fiber = getCurrentFiber();
  const hook = fiber.hooks[currentHookIndex++] || { state: initial, queue: [] };
  // Apply pending updates from queue, return [state, setState]
}
\`\`\`

### Batching
React batches multiple setState calls in event handlers (and in React 18, everywhere). Multiple updates → 1 render.
\`\`\`js
setA(1);
setB(2);
setC(3);
// → 1 render in React 18
\`\`\``,
  },
  {
    id: "fe-effect",
    cat: "React",
    n: "useEffect vs useLayoutEffect",
    s: "After paint (async) vs before paint (sync).",
    depth: "medium",
    level: "L2",
    detail: `## useEffect vs useLayoutEffect

Both: run side effects after render. Difference: **when**.

| | useEffect | useLayoutEffect |
|---|---|---|
| Timing | After paint | Before paint |
| Blocks render | No | Yes |
| Use for | Most things | DOM measurement + sync write |

### useEffect (99% of cases)
Runs async, doesn't block painting. Good for:
- Data fetching
- Subscriptions
- Logging
- Setting up timers

### useLayoutEffect (rare)
Runs sync after DOM updates, before paint. Use when you must read layout and synchronously re-render to avoid a visible flash.

\`\`\`js
// Measure element → adjust based on it
useLayoutEffect(() => {
  const h = ref.current.offsetHeight;
  setHeight(h);  // Reposition BEFORE user sees
}, [content]);
\`\`\`

### Cleanup
Always clean up subscriptions, timers, async to prevent leaks/race conditions.
\`\`\`js
useEffect(() => {
  const id = setInterval(() => tick(), 1000);
  return () => clearInterval(id);  // Cleanup
}, []);
\`\`\`

### Dependency Array
- No array: runs after every render
- Empty \`[]\`: runs once (mount)
- \`[a, b]\`: runs when a or b changes

### Common Mistakes
- Stale closures (missing deps) — ESLint \`react-hooks/exhaustive-deps\` catches
- Object/array deps creating new identity each render → infinite loop
- Fetch without cleanup → setState on unmounted component`,
  },
  {
    id: "fe-memo",
    cat: "React",
    n: "memo vs useMemo vs useCallback",
    s: "Skip re-render / cache value / cache fn ref.",
    depth: "medium",
    level: "L2",
    detail: `## Three Memoization Tools

### React.memo
HOC that skips re-renders if props shallow-equal.
\`\`\`js
const Row = React.memo(function Row({ item, onClick }) { ... });
\`\`\`
Won't help if \`onClick\` is a new fn each render — need useCallback.

### useMemo
Cache an expensive computed value.
\`\`\`js
const sorted = useMemo(() => items.sort(), [items]);
\`\`\`
Don't premature-optimize: memo has overhead. Use for:
- Expensive computations (sort, filter large lists)
- Referential stability for dep arrays of other hooks

### useCallback
Cache a function reference.
\`\`\`js
const handleClick = useCallback(() => doX(id), [id]);
\`\`\`
Useful when passing callbacks to memoized children or as effect deps.

### When NOT to memoize
- Cheap computations (array.map on 10 items)
- Props that always change (functions defined inline)
- "Just in case" — memo has memory + compare cost

### React Compiler (React 19+)
Auto-memoizes. Will make manual memoization mostly obsolete.`,
  },
  {
    id: "fe-context",
    cat: "React",
    n: "Context API Limitations",
    s: "Re-renders ALL consumers on value change.",
    depth: "medium",
    level: "L2",
    detail: `## Context Pitfalls

Context is React's built-in global state. But every consumer re-renders when value changes — no selector/bailout.

\`\`\`js
<UserContext.Provider value={{ user, theme, lang }}>
  {children}
</UserContext.Provider>
// Changing theme re-renders ALL consumers, even those only using user
\`\`\`

### Workarounds
1. **Split contexts** by concern (UserContext + ThemeContext + LangContext)
2. **use-context-selector** lib (pseudo-selector via forceRerender)
3. **State management libs** (Zustand, Redux) — granular subscription
4. **Ref-based subscription** pattern — Context provides the ref, consumers subscribe manually

### Why Not Just Use Context Everywhere?
Works fine for low-frequency updates (auth user, theme). Bad for high-frequency (form inputs, scroll position) — will thrash.

### Best Practices
- Keep context values stable (memoize the provider value)
- Small, focused contexts
- Use state libraries (Zustand) for complex global state
- Never put frequently-changing data in context`,
  },
  {
    id: "fe-rsc",
    cat: "React",
    n: "Server Components (RSC)",
    s: "Components run server-only, zero JS to client.",
    depth: "deep",
    level: "L3",
    detail: `## React Server Components

Components rendered on the server. Zero JS shipped to client for them. Can access DB/file system directly.

\`\`\`js
// app/users/page.jsx — server component by default in Next 13+
import { db } from '@/db';
export default async function UsersPage() {
  const users = await db.query('SELECT * FROM users');
  return <ul>{users.map(u => <li key={u.id}>{u.name}</li>)}</ul>;
}
\`\`\`

### Server vs Client Components
| | Server | Client |
|---|---|---|
| Runs on | Server | Both (SSR + hydrate) |
| JS bundle | 0 bytes | Yes |
| Can use hooks | No | Yes |
| Can access DB/secrets | Yes | No |
| Can use browser APIs | No | Yes |

### Mark Client Component
\`\`\`js
'use client'
import { useState } from 'react';
export default function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n+1)}>{n}</button>;
}
\`\`\`

### Trade-offs
**Pros:**
- Smaller bundles (heavy libs stay server-side)
- DB access without API layer
- SEO-friendly (rendered HTML)

**Cons:**
- Only works with meta-frameworks (Next.js App Router, Remix)
- Mental model shift (no \`useState\` in server components)
- Can't pass functions across server/client boundary

### Streaming
RSC streams HTML progressively — faster TTFB. Suspense boundaries unlock incremental rendering.`,
  },
  {
    id: "fe-concurrent",
    cat: "React",
    n: "Concurrent Features (Suspense, Transitions)",
    s: "startTransition, useDeferredValue, Suspense for non-urgent updates.",
    depth: "deep",
    level: "L2",
    detail: `## Concurrent React (18+)

Splits updates into urgent vs non-urgent. Keeps UI responsive during expensive renders.

### startTransition
Mark state update as low-priority — React can interrupt it for urgent work.
\`\`\`js
const [query, setQuery] = useState('');
const [results, setResults] = useState([]);

function onType(e) {
  setQuery(e.target.value);  // urgent (input must stay responsive)
  startTransition(() => {
    setResults(search(e.target.value));  // non-urgent (expensive)
  });
}
\`\`\`

### useDeferredValue
Like transitions but for values. React uses the stale value while computing new.
\`\`\`js
const deferredQuery = useDeferredValue(query);
// Components using deferredQuery lag 1 render behind but don't block typing
\`\`\`

### Suspense
Declare a loading fallback for any component that might suspend.
\`\`\`jsx
<Suspense fallback={<Spinner />}>
  <ProductList />
</Suspense>
\`\`\`
Works with:
- \`React.lazy(() => import(...))\` for code splitting
- RSC streaming
- Data fetching libs that integrate with Suspense (Relay, React Query v5)

### Error Boundaries
Catch errors in subtree.
\`\`\`jsx
<ErrorBoundary fallback={<Oops />}>
  <Suspense fallback={<Loading />}>
    <App />
  </Suspense>
</ErrorBoundary>
\`\`\`

### Mental Model
Suspense = "this part is loading"
ErrorBoundary = "this part crashed"
startTransition = "this update is lower priority"`,
  },

  // ─── CSS ───────────────────────────────────────────────
  {
    id: "fe-box-model",
    cat: "CSS",
    n: "Box Model & BFC",
    s: "content + padding + border + margin; BFC = layout container.",
    depth: "medium",
    level: "L1",
    detail: `## Box Model

Every element is a box: content, padding, border, margin.

![CSS Box Model](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Introduction_to_the_CSS_box_model/boxmodel.png)

### box-sizing
- \`content-box\` (default): \`width = content width\`. Total = width + padding + border.
- \`border-box\`: \`width = total including padding + border\`. Content shrinks.

\`\`\`css
/* Modern best practice */
*, *::before, *::after { box-sizing: border-box; }
\`\`\`

### Margin Collapse
Adjacent vertical margins merge to the largest.
\`\`\`css
h1 { margin-bottom: 20px; }
p  { margin-top: 10px; }
/* Gap = 20px, not 30px */
\`\`\`
Only vertical, only block-level. Triggered by empty blocks too.

### BFC (Block Formatting Context)
A region with independent layout. Triggered by:
- \`float\` (non-none)
- \`overflow\` (not visible)
- \`display: flow-root\` (modern clean way)
- \`position: absolute/fixed\`
- \`display: inline-block\`

BFC:
- Contains floats (clearfix)
- Prevents margin collapse with outside
- Isolates internal layout

\`\`\`css
.container { display: flow-root; /* Clean BFC */ }
\`\`\``,
  },
  {
    id: "fe-flex-grid",
    cat: "CSS",
    n: "Flexbox vs Grid",
    s: "Flex: 1D; Grid: 2D. Both are essential.",
    depth: "deep",
    level: "L1",
    detail: `## Flexbox (1D)

Distribute space along a single axis.

\`\`\`css
.container {
  display: flex;
  flex-direction: row; /* or column */
  justify-content: space-between; /* main axis */
  align-items: center;            /* cross axis */
  gap: 16px;
}
.item {
  flex: 1; /* grow | shrink | basis → 1 1 0 */
}
\`\`\`

![Flexbox axes](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Flexbox/flex_terms.png)

### Key Properties
| Property | Values |
|---|---|
| flex-direction | row, column, row-reverse |
| flex-wrap | nowrap, wrap |
| justify-content | flex-start, center, space-between, space-around, space-evenly |
| align-items | stretch, center, flex-start, flex-end, baseline |
| flex-grow | 0 (default), 1+ |
| flex-shrink | 1 (default), 0 |
| flex-basis | auto, length, % |

## Grid (2D)

Control rows AND columns.

\`\`\`css
.container {
  display: grid;
  grid-template-columns: 200px 1fr 1fr;
  grid-template-rows: auto 1fr auto;
  gap: 16px;
}
.item { grid-column: 1 / 3; } /* span 2 cols */
\`\`\`

### Named Areas (readable)
\`\`\`css
.layout {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav    main   aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: 60px 1fr 60px;
}
.header { grid-area: header; }
.nav { grid-area: nav; }
\`\`\`

### When to Use Which
- **Flex**: navbars, buttons, rows of cards
- **Grid**: page layouts, photo galleries, complex 2D arrangements
- Often nested: Grid for page, Flex for components inside

### Intrinsic Sizing
\`minmax(200px, 1fr)\`, \`auto-fit\`, \`auto-fill\` — responsive without media queries.
\`\`\`css
grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
\`\`\``,
  },
  {
    id: "fe-css-custom",
    cat: "CSS",
    n: "CSS Custom Properties & Modern Features",
    s: "Runtime variables, container queries, :has(), layers.",
    depth: "medium",
    level: "L2",
    detail: `## Custom Properties (CSS Variables)

Runtime variables that cascade. Unlike SASS variables, changeable via JS.

\`\`\`css
:root {
  --primary: #ff6b35;
  --space: 8px;
}
.button {
  background: var(--primary);
  padding: calc(var(--space) * 2);
}
\`\`\`

### Themes
\`\`\`css
:root { --bg: white; --fg: black; }
[data-theme="dark"] { --bg: #111; --fg: #eee; }
body { background: var(--bg); color: var(--fg); }
\`\`\`
\`\`\`js
document.documentElement.dataset.theme = 'dark';
\`\`\`

## Container Queries
Query parent size, not viewport. Finally!
\`\`\`css
.card-container { container-type: inline-size; }
@container (min-width: 500px) {
  .card { display: grid; grid-template-columns: 1fr 2fr; }
}
\`\`\`

## :has() — The Parent Selector
\`\`\`css
/* Card has an image → add padding */
.card:has(img) { padding-top: 0; }

/* Form with error state */
form:has(input:invalid) button { opacity: 0.5; }
\`\`\`

## @layer — Explicit Cascade Control
\`\`\`css
@layer reset, base, components, utilities;
@layer components {
  .btn { ... }
}
/* utilities always wins over components, regardless of source order */
\`\`\`

## Logical Properties
RTL-friendly (used for internationalization).
\`\`\`css
margin-inline-start: 10px;  /* ≈ margin-left in LTR, margin-right in RTL */
padding-block: 20px;         /* top + bottom */
\`\`\``,
  },

  // ─── Performance & Web Vitals ──────────────────────────
  {
    id: "fe-core-web-vitals",
    cat: "Performance",
    n: "Core Web Vitals (LCP, INP, CLS)",
    s: "Google's UX metrics — loading, responsiveness, stability.",
    depth: "deep",
    level: "L2",
    detail: `## Core Web Vitals

Google's user-experience metrics — factored into search ranking since 2021.

![Core Web Vitals](https://web.dev/static/articles/vitals/image/core-web-vitals.svg)

## LCP — Largest Contentful Paint
Time to render the largest visible element. Measures **loading**.

- **Good:** ≤ 2.5s
- **Needs improvement:** 2.5s – 4s
- **Poor:** > 4s

### What is the LCP element?
Usually hero image, headline, or video poster. Inspect via Chrome DevTools → Performance → Timings.

### Optimize
- **Preload the LCP asset**: \`<link rel="preload" as="image" href="hero.webp" fetchpriority="high">\`
- **Server-side render** critical HTML (SSR/SSG)
- **CDN + Brotli** compression
- Correct **cache headers** (\`Cache-Control: public, max-age=31536000, immutable\`)
- Avoid render-blocking CSS/JS — defer non-critical
- Inline critical CSS; rest lazy-loaded
- Use modern image formats (WebP/AVIF) and proper \`srcset\` + \`sizes\`
- Avoid client-side data fetch for hero content

## INP — Interaction to Next Paint (replaced FID in 2024)
Worst interaction latency during the session. Measures **responsiveness**.

- **Good:** ≤ 200ms
- **Needs improvement:** 200ms – 500ms
- **Poor:** > 500ms

### Optimize
- Break long tasks: \`await scheduler.yield()\` or \`setTimeout(fn, 0)\`
- Defer non-critical JS (\`<script defer>\`, \`<script type="module">\`)
- **Web Workers** for CPU-heavy work (parsing, cryptography)
- Debounce expensive handlers (search, scroll)
- Avoid layout thrashing (batch reads, then writes)
- Virtualize long lists (react-virtual, react-window)
- Use \`content-visibility: auto\` for off-screen content

## CLS — Cumulative Layout Shift
Sum of unexpected layout shifts. Measures **visual stability**.

- **Good:** ≤ 0.1
- **Needs improvement:** 0.1 – 0.25
- **Poor:** > 0.25

### Optimize
- Always set \`width\` and \`height\` on images/videos (or aspect-ratio)
- Reserve space for ads/embeds before load
- Never insert content above existing (except on user action)
- Use \`font-display: optional\` to avoid FOIT/FOUT shifts
- Preload webfonts
- Avoid layout-affecting CSS animations (animate \`transform\` not \`top\`)

## Measure in Code
\`\`\`js
import { onLCP, onINP, onCLS } from 'web-vitals';
onLCP(v => analytics('LCP', v.value));
onINP(v => analytics('INP', v.value));
onCLS(v => analytics('CLS', v.value));
\`\`\`

## Other Important Metrics
- **TTFB** (Time to First Byte) — server response speed
- **FCP** (First Contentful Paint) — first pixel drawn
- **TBT** (Total Blocking Time) — sum of long tasks > 50ms
- **TTI** (Time to Interactive) — page fully interactive`,
  },
  {
    id: "fe-lighthouse",
    cat: "Performance",
    n: "Lighthouse & Audit Tools",
    s: "Chrome's built-in auditor scoring perf, a11y, SEO, PWA.",
    depth: "medium",
    level: "L1",
    detail: `## Lighthouse

Open-source auditing tool built into Chrome DevTools (also available as CLI, Node module, CI action). Scores pages on 5 categories:

![Lighthouse Report](https://developer.chrome.com/static/docs/lighthouse/overview/image/lighthouse-report.png)

### Categories
1. **Performance** — LCP, CLS, TBT, FCP, Speed Index
2. **Accessibility** — ARIA, contrast, semantic HTML
3. **Best Practices** — HTTPS, console errors, deprecated APIs
4. **SEO** — meta tags, viewport, sitemap, structured data
5. **PWA** — manifest, service worker, installable

### Scoring
Each category 0-100. Performance score is weighted:
- FCP: 10%
- LCP: 25%
- Speed Index: 10%
- TBT: 30%
- CLS: 25%

### How to Run
1. **Chrome DevTools** → Lighthouse tab → Analyze (mobile vs desktop, throttling)
2. **CLI**: \`npm install -g lighthouse && lighthouse https://example.com\`
3. **PageSpeed Insights**: https://pagespeed.web.dev/ (uses real-world CrUX data too)
4. **CI**: lighthouse-ci to track scores over time, fail PR if below threshold

### Lab vs Field Data
- **Lab** (Lighthouse, WebPageTest): synthetic, controlled — for debugging
- **Field** (CrUX, web-vitals lib → your analytics): real users — for monitoring

### Limitations
- Tests one page at a time
- Simulated throttling can be inaccurate
- Heavy JS apps score poorly even when fast in real use
- Use \`--preset=desktop\` for desktop-targeted apps

## Other Tools
- **WebPageTest** — deep waterfall, filmstrip, multi-location testing
- **Chrome DevTools Performance tab** — flame graphs, long tasks
- **Chrome Performance Insights** — actionable suggestions inline
- **Bundle Analyzer** — webpack-bundle-analyzer, rollup-plugin-visualizer
- **React Profiler** — flame graphs for React renders`,
  },
  {
    id: "fe-perf-techniques",
    cat: "Performance",
    n: "Performance Techniques",
    s: "Code splitting, lazy loading, tree shaking, bundling.",
    depth: "deep",
    level: "L2",
    detail: `## Bundle Optimization

### Tree Shaking
Dead code elimination via ES module static analysis.
\`\`\`js
// Only \`debounce\` is bundled
import { debounce } from 'lodash-es';
// vs CommonJS — no tree shaking
const _ = require('lodash'); // Bundles entire lodash
\`\`\`

### Code Splitting
Split bundle by route/component.

**Route-based:**
\`\`\`js
const Dashboard = React.lazy(() => import('./Dashboard'));
<Suspense fallback={<Spinner />}><Dashboard /></Suspense>
\`\`\`

**Component-based:**
\`\`\`js
const HeavyChart = React.lazy(() => import('./HeavyChart'));
// Only loads when rendered
\`\`\`

**Library-based:**
\`\`\`js
// webpack config
optimization: {
  splitChunks: {
    cacheGroups: {
      vendor: { test: /[\\/]node_modules[\\/]/, name: 'vendors' },
    },
  },
}
\`\`\`

### Lazy Loading
Load assets only when needed.
\`\`\`html
<img src="hero.jpg" loading="lazy" width="800" height="400" />
<iframe src="video" loading="lazy"></iframe>
\`\`\`

### Preload / Prefetch / Preconnect
- \`preload\` — needed now (this page)
- \`prefetch\` — needed later (next page)
- \`preconnect\` — DNS + TCP + TLS for future request

\`\`\`html
<link rel="preload" href="/hero.webp" as="image" fetchpriority="high" />
<link rel="prefetch" href="/dashboard.js" />
<link rel="preconnect" href="https://api.example.com" />
\`\`\`

## Runtime Performance

### Virtualization
Render only visible items in long lists.
\`\`\`js
import { useVirtualizer } from '@tanstack/react-virtual';
const v = useVirtualizer({ count: 10000, estimateSize: () => 50 });
\`\`\`

### Debouncing & Throttling
- **Debounce**: wait N ms after last call (search input)
- **Throttle**: at most once per N ms (scroll, resize)

### Avoid Layout Thrashing
\`\`\`js
// BAD — forces layout on every read
items.forEach(item => {
  const h = item.offsetHeight;  // read (reflow)
  item.style.height = h + 10;   // write (invalidate)
});

// GOOD — batched
const heights = items.map(i => i.offsetHeight);   // all reads
items.forEach((i, idx) => i.style.height = heights[idx] + 10); // all writes
\`\`\`

### will-change + transform
Animate \`transform\`/\`opacity\` (GPU-accelerated, no layout/paint):
\`\`\`css
.animated { will-change: transform; }
.animated:hover { transform: translateX(10px); }
\`\`\`

### Images
- Use **WebP/AVIF** (30-50% smaller than JPEG)
- Use \`srcset\` for responsive images
- \`loading="lazy"\` for below-fold
- Lazy-load with IntersectionObserver for custom cases

### Web Workers
Offload CPU-heavy work so main thread stays responsive.
\`\`\`js
const worker = new Worker('./worker.js');
worker.postMessage({ data });
worker.onmessage = e => setResult(e.data);
\`\`\`

## Network
- **HTTP/2 or HTTP/3** — multiplexed streams
- **CDN** — serve from edge close to user
- **Brotli** compression — smaller than gzip
- **Service Workers** — cache aggressively, offline support`,
  },

  // ─── Accessibility ─────────────────────────────────────
  {
    id: "fe-a11y",
    cat: "Accessibility",
    n: "Accessibility (a11y) Fundamentals",
    s: "Semantic HTML, ARIA, keyboard nav, screen readers.",
    depth: "deep",
    level: "L2",
    detail: `## Why Accessibility Matters
1. **It's the law** — ADA (US), EN 301 549 (EU) mandate a11y
2. **1B+ people** have disabilities — huge addressable market
3. **SEO** — accessible sites rank better
4. **Usability for all** — captions help in noisy env, keyboard nav helps power users

## WCAG 2.1 — Four Principles (POUR)
1. **Perceivable** — text alternatives, captions, contrast
2. **Operable** — keyboard accessible, enough time
3. **Understandable** — readable, predictable
4. **Robust** — works with assistive tech

Levels: A (minimum), **AA** (target), AAA (strict).

## Semantic HTML First
\`\`\`html
<!-- BAD -->
<div class="button" onclick="submit()">Submit</div>

<!-- GOOD -->
<button type="submit">Submit</button>
\`\`\`
Semantic elements give screen readers free context — role, state, behavior.

Structure pages with:
\`\`\`html
<header><nav>...</nav></header>
<main>
  <h1>Page title</h1>
  <article>...</article>
  <aside>...</aside>
</main>
<footer>...</footer>
\`\`\`

## ARIA (when HTML isn't enough)

### Three Pillars
- **role** — what is it? (button, alert, dialog, menu)
- **state** — aria-expanded, aria-checked, aria-selected, aria-disabled
- **property** — aria-label, aria-labelledby, aria-describedby

### Example: Custom Dropdown
\`\`\`html
<button
  aria-haspopup="listbox"
  aria-expanded="true"
  aria-labelledby="label"
>Select option</button>
<ul role="listbox" aria-labelledby="label">
  <li role="option" aria-selected="true">Option 1</li>
  <li role="option">Option 2</li>
</ul>
\`\`\`

### First Rule of ARIA
**Don't use ARIA if a native element does the job.** \`<button>\` > \`<div role="button">\`.

## Keyboard Navigation
All interactive elements must be reachable + operable via keyboard.
- Tab / Shift+Tab — between focusable elements
- Enter/Space — activate buttons
- Arrow keys — within composite widgets (menus, tabs)
- Escape — close dialogs

### Focus Management
- Visible focus ring (don't \`outline: none\` without alternative!)
- Focus trap in modals
- Return focus on close
- Skip links for keyboard users to jump past nav

\`\`\`css
/* Good — replaces outline with visible indicator */
button:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
\`\`\`

## Screen Readers
- **NVDA** (Windows, free)
- **JAWS** (Windows, paid)
- **VoiceOver** (macOS/iOS, built-in: Cmd+F5)
- **TalkBack** (Android)

### Announce Dynamic Updates
\`\`\`html
<div aria-live="polite">Loading results...</div>
<div aria-live="assertive" role="alert">Error!</div>
\`\`\`

## Contrast
Minimum contrast ratios (WCAG AA):
- Normal text: **4.5:1**
- Large text (18pt+ or 14pt bold): **3:1**
- UI components/graphics: **3:1**

Tools: Chrome DevTools contrast checker, axe, Stark.

## Testing
- **Automated**: axe-core, eslint-plugin-jsx-a11y, Lighthouse
- **Manual**: keyboard-only navigation, screen reader walkthrough
- **User testing** with assistive tech users

Automated tools catch ~30-40% of issues. Manual testing is essential.`,
  },
  {
    id: "fe-i18n",
    cat: "Accessibility",
    n: "Internationalization (i18n/l10n)",
    s: "Locales, RTL, pluralization, ICU message format.",
    depth: "medium",
    level: "L2",
    detail: `## i18n vs l10n
- **i18n** (internationalization) — make your app ready for multiple languages
- **l10n** (localization) — translate content for a specific locale

## Setup (React with react-intl)

\`\`\`js
import { IntlProvider, FormattedMessage, FormattedNumber } from 'react-intl';

const messages = {
  en: { greeting: 'Hello, {name}!' },
  hi: { greeting: 'नमस्ते, {name}!' },
};

<IntlProvider locale="hi" messages={messages.hi}>
  <FormattedMessage id="greeting" values={{ name: 'Anand' }} />
</IntlProvider>
// → "नमस्ते, Anand!"
\`\`\`

## Pluralization (ICU MessageFormat)
Not as simple as \`count === 1 ? 'item' : 'items'\` — many languages have 3+ plural forms.

\`\`\`
{count, plural,
  =0 {No items}
  one {# item}
  other {# items}
}
\`\`\`

Russian has 4 forms; Arabic 6. Use ICU; don't roll your own.

## Number & Date Formatting
Use \`Intl\` API — built-in, no library needed.

\`\`\`js
new Intl.NumberFormat('en-IN').format(100000);
// → "1,00,000"  (Indian numbering)

new Intl.NumberFormat('de-DE').format(1234.56);
// → "1.234,56"  (German — comma decimal, period thousands)

new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date());
// → "April 18, 2026"

new Intl.RelativeTimeFormat('en').format(-1, 'day');
// → "1 day ago"
\`\`\`

## RTL (Right-to-Left)
Arabic, Hebrew, Persian, Urdu. Layout mirrors.

### Logical Properties
\`\`\`css
/* Instead of margin-left, use margin-inline-start */
.el {
  margin-inline-start: 10px;  /* left in LTR, right in RTL */
  padding-block: 20px;         /* top + bottom */
  border-inline-end: 1px solid; /* right in LTR, left in RTL */
}
\`\`\`

### Direction Attribute
\`\`\`html
<html dir="rtl" lang="ar">
\`\`\`

### Mirroring Icons
Some icons flip in RTL (← ≠ direction-agnostic).
\`\`\`css
[dir="rtl"] .icon-back { transform: scaleX(-1); }
\`\`\`

## Text Expansion
German is ~30% longer than English. Chinese 30% shorter. Don't assume text length — use flexible layouts.

## Best Practices
1. Externalize strings — don't hardcode in components
2. Include translator context: "Button label for checkout"
3. Use ICU for complex messages
4. Respect user preference: \`navigator.languages\`
5. Format dates/numbers with \`Intl\`, never manual
6. Test with long German text, Arabic RTL, Chinese
7. Persist locale in URL or user preference (not just cookie)

## Libraries
- **react-intl** / **FormatJS** — ICU support
- **i18next** — framework-agnostic, tons of features
- **Lingui** — compile-time extraction`,
  },

  // ─── TypeScript ────────────────────────────────────────
  {
    id: "fe-ts-basics",
    cat: "TypeScript",
    n: "TypeScript Fundamentals",
    s: "Types, interfaces, generics, narrowing.",
    depth: "medium",
    level: "L1",
    detail: `## Why TypeScript
- Catch errors at compile time, not runtime
- IDE autocomplete & refactoring
- Documentation via types
- Scales to large codebases

## Primitive Types
\`\`\`ts
let name: string = "Alex";
let age: number = 30;
let active: boolean = true;
let tags: string[] = ["a", "b"];
let tuple: [string, number] = ["hello", 42];
\`\`\`

## Interface vs Type
\`\`\`ts
interface User { name: string; age: number; }
type User = { name: string; age: number; };
\`\`\`
Both work for object shapes. Differences:
- Interface: declaration merging, extends
- Type: unions, intersections, mapped/conditional

Prefer \`type\` for unions; \`interface\` for public API shapes.

## Union & Intersection
\`\`\`ts
type Status = "loading" | "success" | "error";  // Union
type Admin = User & { role: "admin"; };           // Intersection
\`\`\`

## Generics
Reusable types parameterized by other types.
\`\`\`ts
function identity<T>(x: T): T { return x; }
identity(42);       // T = number
identity("hello");  // T = string

interface ApiResponse<T> {
  data: T;
  status: number;
}
const resp: ApiResponse<User[]> = await fetch(...);
\`\`\`

## Narrowing
TypeScript uses control flow to narrow types.
\`\`\`ts
function process(x: string | number) {
  if (typeof x === "string") {
    x.toUpperCase();  // x is string here
  } else {
    x.toFixed(2);     // x is number here
  }
}
\`\`\`

Narrow via: \`typeof\`, \`instanceof\`, \`in\`, equality, user-defined guards.

## User-Defined Type Guards
\`\`\`ts
interface Dog { bark(): void; }
interface Cat { meow(): void; }

function isDog(x: Dog | Cat): x is Dog {
  return 'bark' in x;
}

function handle(a: Dog | Cat) {
  if (isDog(a)) a.bark();
  else a.meow();
}
\`\`\`

## Discriminated Unions
Very powerful pattern for state.
\`\`\`ts
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: User[] }
  | { status: "error"; error: string };

function render(s: State) {
  switch (s.status) {
    case "success": return s.data.map(...);  // data available
    case "error":   return s.error;           // error available
  }
}
\`\`\``,
  },
  {
    id: "fe-ts-advanced",
    cat: "TypeScript",
    n: "Advanced TypeScript (Generics, Conditional, Mapped)",
    s: "Utility types, infer, template literals, branded types.",
    depth: "deep",
    level: "L2",
    detail: `## Utility Types

Built-in transformations.
\`\`\`ts
interface User { id: string; name: string; email: string; }

Partial<User>     // { id?: string; name?: string; email?: string; }
Required<User>    // All required
Readonly<User>    // All readonly
Pick<User, "id">  // { id: string; }
Omit<User, "id">  // { name: string; email: string; }
Record<string, number> // { [key: string]: number }
\`\`\`

## Mapped Types
Transform every property.
\`\`\`ts
type Nullable<T> = { [K in keyof T]: T[K] | null };
type NullableUser = Nullable<User>;
// { id: string | null; name: string | null; email: string | null }

type Getters<T> = {
  [K in keyof T as \`get\${Capitalize<string & K>}\`]: () => T[K];
};
type UserGetters = Getters<User>;
// { getId: () => string; getName: () => string; getEmail: () => string; }
\`\`\`

## Conditional Types
\`\`\`ts
type IsArray<T> = T extends any[] ? true : false;
type A = IsArray<string[]>;  // true
type B = IsArray<string>;    // false
\`\`\`

## infer — Extract Nested Types
\`\`\`ts
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never;
type R = ReturnOf<() => string>;  // string

type Awaited<T> = T extends Promise<infer U> ? Awaited<U> : T;
type Data = Awaited<Promise<Promise<string>>>;  // string
\`\`\`

## Template Literal Types
\`\`\`ts
type Greeting = \`hello, \${string}\`;
const a: Greeting = "hello, world";  // OK
const b: Greeting = "hi there";      // Error

type EventName = \`on\${Capitalize<string>}\`;
const e: EventName = "onClick";  // OK
\`\`\`

## Branded Types — Nominal Typing
Normally TS is structural. Branding adds nominal behavior.
\`\`\`ts
type UserId = string & { __brand: "UserId" };
type PostId = string & { __brand: "PostId" };

function get(id: UserId) { ... }
const uid = "abc" as UserId;
const pid = "def" as PostId;
get(uid);  // OK
get(pid);  // Error — even though both are strings
\`\`\`

## Type Predicates & Assertion Functions
\`\`\`ts
function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) throw new Error(msg);
}

function handle(x: string | null) {
  assert(x, "x must be set");
  x.toUpperCase();  // x is string after assert
}
\`\`\`

## Const Assertions
\`\`\`ts
const colors = ["red", "green", "blue"] as const;
type Color = typeof colors[number];  // "red" | "green" | "blue"
\`\`\`

## Common Interview Exercises
- Implement \`DeepPartial<T>\`
- Implement \`Exclude\`, \`Extract\` from scratch
- Type-safe \`get(obj, "path.to.value")\`
- Type-safe event emitter
- \`UnionToIntersection<T>\``,
  },

  // ─── Build Tools & Tooling ─────────────────────────────
  {
    id: "fe-webpack-vite",
    cat: "Tooling",
    n: "Webpack vs Vite vs esbuild",
    s: "Bundlers compared; dev experience; production builds.",
    depth: "medium",
    level: "L2",
    detail: `## Build Tool Comparison

| | Webpack | Vite | esbuild | Rollup |
|---|---|---|---|---|
| Language | JS | JS (esbuild+Rollup inside) | Go | JS |
| Speed | Slow | Fast dev, medium build | Very fast | Medium |
| Dev strategy | Bundle everything | Native ESM in browser | Bundle | Bundle |
| Plugin ecosystem | Huge | Growing | Small | Moderate |
| Best for | Legacy, complex | Modern apps | Libraries, CLI | Libraries |

## Webpack
Mature, configurable. Bundles everything (including dev).
\`\`\`js
// webpack.config.js
module.exports = {
  entry: './src/index.js',
  output: { filename: 'bundle.[contenthash].js' },
  module: {
    rules: [
      { test: /\\.jsx?$/, use: 'babel-loader' },
      { test: /\\.css$/, use: ['style-loader', 'css-loader'] },
    ],
  },
  plugins: [new HtmlWebpackPlugin()],
  optimization: { splitChunks: { chunks: 'all' } },
};
\`\`\`

**Pros:** most mature, battle-tested, huge ecosystem.
**Cons:** slow dev server on big projects, complex config.

## Vite
Modern, leverages native ESM in dev.

**Dev:** serves source files as ESM — browser requests modules lazily. Uses esbuild to pre-bundle dependencies. Near-instant startup + HMR regardless of project size.

**Prod:** uses Rollup for tree-shaken, optimized bundles.

\`\`\`js
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: { port: 3000 },
});
\`\`\`

**Pros:** fast, simple config, modern defaults.
**Cons:** newer (smaller plugin count), some legacy libs don't play nice.

## esbuild
Go-based, extremely fast single-file bundler. Lower-level.

## Rollup
Great for libraries (produces clean ESM output). Heart of Vite's prod build.

## Choose By Use Case
- **New app** → Vite
- **Existing Webpack project** → migrate incrementally if pain
- **Publishing a library** → Rollup (or tsup)
- **CLI tool** → esbuild (single binary, fast)
- **Next.js/Remix** → they handle it for you

## Tree Shaking
Relies on ES modules' static structure. Works with:
\`\`\`js
import { only } from 'lib';
\`\`\`
Fails with:
\`\`\`js
const lib = require('lib');
\`\`\`
Mark pure side-effect-free packages in package.json: \`"sideEffects": false\`.`,
  },
  {
    id: "fe-monorepo",
    cat: "Tooling",
    n: "Monorepo (Nx, Turborepo, pnpm)",
    s: "Multiple packages in one repo, task orchestration.",
    depth: "medium",
    level: "L2",
    detail: `## Monorepo vs Polyrepo
- **Polyrepo**: one repo per package. Pros: isolation. Cons: cross-repo changes painful.
- **Monorepo**: all packages in one repo. Pros: atomic cross-package changes, shared tooling. Cons: scaling build times, access control.

Used by: Google, Meta, Microsoft (Babel, Webpack, Next.js are monorepos).

## Tools
### pnpm Workspaces (simplest)
\`\`\`yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
\`\`\`
\`\`\`
/
  apps/
    web/
    mobile/
  packages/
    ui/
    utils/
\`\`\`
pnpm hoists dependencies + symlinks → fast installs, no duplication.

### Turborepo (by Vercel)
Remote caching — build once, share across team/CI.
\`\`\`json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": { "dependsOn": ["build"] }
  }
}
\`\`\`
\`turbo run build\` understands the graph, runs parallel, caches outputs.

### Nx (by Nrwl)
Full-featured. Code generators, dependency graph, affected-only builds.
\`\`\`bash
nx generate @nx/react:component my-button --project=ui
nx affected:test         # Only test packages affected by git changes
\`\`\`

## Key Concepts

### Affected-only Builds
Only rebuild packages whose code (or dep's code) changed.
\`\`\`bash
turbo run build --filter=...[main]
nx affected -t build --base=main
\`\`\`

### Remote Caching
Push build outputs to a shared cache (Vercel, Nx Cloud, self-hosted).
CI runs become seconds instead of minutes.

### Task Pipelines
Declare dependencies between tasks:
- Build app B depends on build of package A
- Test depends on build

### Code Sharing
Shared \`packages/\` for UI components, utilities, types. Apps import:
\`\`\`ts
import { Button } from '@myorg/ui';
\`\`\`

## Downsides
- CI config complexity
- Bigger repo (more memory for IDE)
- Permissions — whole team has access to everything
- Large refactors feel scarier (affects many packages)`,
  },
  {
    id: "fe-microfrontends",
    cat: "Architecture",
    n: "Micro-frontends",
    s: "Module Federation, runtime composition, team autonomy.",
    depth: "medium",
    level: "L3",
    detail: `## Micro-frontends
Extend microservices architecture to the frontend. Different teams ship different parts of the UI independently.

### Why
- **Independent deployment** — team A ships without waiting for team B
- **Tech flexibility** — one team uses React, another Vue (usually discouraged in practice)
- **Scalability** — large orgs with many teams
- **Fault isolation** — one section broken doesn't break the whole app

### When NOT to use
- Small app / small team → overhead > benefit
- Single team → use normal modules

## Approaches

### 1. iframe
Simplest. Fully isolated. But: slow, awkward nav, duplicate frameworks loaded.

### 2. Module Federation (Webpack 5 / Rspack)
Runtime composition — host app loads remote bundles at runtime.

\`\`\`js
// Host (shell)
new ModuleFederationPlugin({
  name: "host",
  remotes: {
    products: "products@http://localhost:3001/remoteEntry.js",
    cart: "cart@http://localhost:3002/remoteEntry.js",
  },
});

// Remote (products app)
new ModuleFederationPlugin({
  name: "products",
  filename: "remoteEntry.js",
  exposes: {
    "./ProductList": "./src/ProductList",
  },
});

// Use in host
const ProductList = React.lazy(() => import("products/ProductList"));
\`\`\`

### 3. single-spa
Framework-agnostic orchestration. Each MFE registers a lifecycle (bootstrap, mount, unmount).

### 4. Server-side composition (SSI, ESI)
Stitch HTML fragments server-side. Used by Zalando's Mosaic, Nginx SSI.

## Challenges

### Shared Dependencies
Both apps import React. Do they share one React instance? Important for context, hooks.
Module Federation: \`shared: { react: { singleton: true } }\`

### Routing
One router owns top-level routes → delegates to MFEs. Or coordinate via browser history.

### Shared State
Avoid shared global state. Use events or explicit props.
- Pub/sub via custom events
- Broadcast Channel API

### Design Consistency
Shared design system package. Enforced via linting / visual regression tests.

### Versioning
Remote bundles are dynamically loaded → need contract between host and remote. Breaking changes are painful.

## Rule of Thumb
"You probably don't need micro-frontends." They solve team scale problems. Technical cost is real. Start as a modular monolith.`,
  },
  {
    id: "fe-design-system",
    cat: "Architecture",
    n: "Design Systems",
    s: "Token architecture, component API, theming, documentation.",
    depth: "deep",
    level: "L2",
    detail: `## What is a Design System?
Shared source of truth: design tokens, components, patterns, documentation.

Famous examples: Material Design (Google), Carbon (IBM), Polaris (Shopify), Atlassian Design System.

## Layers

### 1. Design Tokens (atomic values)
\`\`\`js
// tokens.js
export const tokens = {
  color: {
    primary: { 100: '#fff5e6', 500: '#ff6b35', 900: '#1a0700' },
    neutral: { 100: '#fff', 500: '#888', 900: '#000' },
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
  fontSize: { sm: 12, base: 14, lg: 18, xl: 24 },
  radius: { sm: 2, md: 4, lg: 8, full: 9999 },
};
\`\`\`

Tokens feed into CSS custom properties:
\`\`\`css
:root {
  --color-primary-500: #ff6b35;
  --space-md: 16px;
}
\`\`\`

Tooling: **Style Dictionary**, **Theo** — transform tokens into CSS, iOS (Swift), Android (XML).

### 2. Primitives (lowest-level components)
\`Box\`, \`Stack\`, \`Text\`, \`Icon\` — compose everything from these.

### 3. Components (Button, Input, Modal, Card)
Higher-level, opinionated.

### 4. Patterns (Login form, Checkout, Page header)
Full-page layouts combining components.

## Component API Design

### Anti-pattern: prop explosion
\`\`\`tsx
<Button primary large iconLeft icon="home" rounded shadow />
\`\`\`

### Better: composable
\`\`\`tsx
<Button variant="primary" size="lg">
  <Icon name="home" />
  Home
</Button>
\`\`\`

### Headless UI pattern
Component provides behavior + accessibility, no styles. You style.
- **Radix UI**, **Headless UI**, **Ariakit**, **React Aria**

\`\`\`tsx
<Dialog.Root open={open} onOpenChange={setOpen}>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Heading</Dialog.Title>
      <Dialog.Close>X</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
\`\`\`

## Theming
- Light / dark mode
- Density (compact / comfortable)
- Brand themes (for multi-tenant apps)

Implement via CSS custom properties swapping:
\`\`\`css
[data-theme="dark"] { --color-bg: #111; }
\`\`\`

## Documentation
- **Storybook** — interactive component playground
- **Chromatic** — visual regression testing of Stories
- **Docusaurus / Nextra** — docs site

## Versioning
Design system must follow semver. Breaking changes need migration guides.
Monorepo pattern is common — design system package + internal apps.

## Metrics of Success
- % of screens using design system (not rogue CSS)
- Time-to-first-screen for new features
- Consistency audit (design QA tools)
- Accessibility score (automated + audits)`,
  },
  {
    id: "fe-pwa",
    cat: "Architecture",
    n: "PWA & Service Workers",
    s: "Offline-first, push notifications, installable.",
    depth: "medium",
    level: "L2",
    detail: `## Progressive Web App (PWA)
Web app that behaves like native: installable, offline-capable, pushes notifications.

Baseline requirements:
1. HTTPS
2. Web App Manifest
3. Service Worker

## Web App Manifest
\`\`\`json
// public/manifest.json
{
  "name": "My App",
  "short_name": "App",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#fff",
  "theme_color": "#ff6b35",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
\`\`\`

Browsers offer "Install app" when manifest + service worker + engagement heuristic met.

## Service Workers
JS running in background, intercepting network requests. Separate thread.

Lifecycle: install → activate → fetch events.

\`\`\`js
// sw.js
const CACHE = 'v1';
const ASSETS = ['/', '/index.html', '/app.css', '/app.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  );
});
\`\`\`

Register:
\`\`\`js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
\`\`\`

## Caching Strategies
- **Cache first** — use cache, fall back to network (static assets)
- **Network first** — use network, fall back to cache (API data)
- **Stale-while-revalidate** — serve cache, update in background
- **Cache only** — for pre-cached app shell
- **Network only** — for analytics beacons

## Workbox
Google's library that abstracts service worker patterns.
\`\`\`js
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({ cacheName: 'api' })
);
\`\`\`

## Push Notifications
Browser shows native notification even when page closed.

1. Request permission
2. Subscribe to push via service worker
3. Send endpoint to your server
4. Server sends message via Web Push protocol (or FCM, OneSignal)

\`\`\`js
const permission = await Notification.requestPermission();
const sub = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: VAPID_PUBLIC_KEY,
});
// Send sub to server to store
\`\`\`

## Background Sync
Retry failed requests when back online.

## Challenges
- Debugging is hard (service worker update cycle)
- \`skipWaiting\` + \`clients.claim\` for aggressive updates
- Never cache \`index.html\` long — users stuck on old version
- iOS Safari support lagged for years (now decent)`,
  },
  {
    id: "fe-ssr",
    cat: "Architecture",
    n: "SSR, SSG, ISR, Streaming (Next.js, Remix)",
    s: "Rendering strategies + trade-offs.",
    depth: "deep",
    level: "L2",
    detail: `## Rendering Strategies

### CSR (Client-Side Rendering)
HTML is minimal; JS fetches data + renders. Classic SPA.
- **Pros:** simple, cheap hosting
- **Cons:** slow first load, bad SEO, white screen while JS loads

### SSR (Server-Side Rendering)
Server renders HTML per request. Ships to client, then hydrates.
- **Pros:** fast first paint, SEO, social cards work
- **Cons:** higher server cost, TTFB depends on data
- **Frameworks:** Next.js (default in App Router), Remix, Nuxt, SvelteKit

### SSG (Static Site Generation)
Pre-render HTML at build time. Serve from CDN.
- **Pros:** fastest, cheap hosting, resilient
- **Cons:** rebuild on content changes, not for personalized content
- **Use case:** docs, blogs, marketing sites
- **Frameworks:** Next.js \`getStaticProps\`, Astro, 11ty, Hugo

### ISR (Incremental Static Regeneration)
Mix of SSG + SSR. Page pre-rendered, regenerated in background on request (on-demand or cron).
- **Pros:** static speed + dynamic content
- **Cons:** stale data window; more complex cache model
- **Next.js**: \`revalidate: 60\` regenerates every 60s max

### Streaming SSR
Server sends HTML in chunks as it's ready.
\`\`\`jsx
// Suspense boundary = streaming boundary
<Suspense fallback={<Skeleton />}>
  <SlowComponent />  {/* Rest of page streams first */}
</Suspense>
\`\`\`
- **Pros:** better TTFB, progressive rendering
- **Cons:** more complex, not all infra supports streaming

### RSC (React Server Components, Next.js App Router)
Components rendered only on server. Zero client JS. Can access DB directly.

### Islands Architecture (Astro)
Static HTML by default. Hydrate only interactive "islands".
- **Pros:** tiny JS bundles, great perf
- **Cons:** not for SPA-heavy apps

## Decision Matrix
| Need | Use |
|---|---|
| Marketing site, blog | **SSG** or **Astro** |
| E-commerce PDP | **SSG + ISR** or **SSR** |
| User dashboard | **SSR** (or **CSR** if auth-wall) |
| Docs | **SSG** |
| Highly dynamic social feed | **SSR + streaming** |

## Hydration
Process of attaching React to server-rendered HTML.
- **Hydration mismatch** — server HTML ≠ client render → React warns + rebuilds
- **Partial hydration** — hydrate only interactive parts
- **Progressive hydration** — hydrate on intent (viewport, interaction)
- **Lazy hydration** — defer until idle (React.lazy)

## Caveats
- **\`window\` not defined on server** — wrap in \`useEffect\` or \`typeof window !== 'undefined'\`
- **localStorage** → client-only
- **Date/random** → seed consistently or defer to client`,
  },
  {
    id: "fe-testing",
    cat: "Testing",
    n: "Frontend Testing (Jest, RTL, Playwright, MSW)",
    s: "Unit / integration / E2E / visual regression.",
    depth: "medium",
    level: "L2",
    detail: `## Testing Pyramid (FE)

\`\`\`
    /E2E\\          few (5-10 critical flows)
   /------\\
  /Integr.\\       medium (component + API mocks)
 /----------\\
/   Unit     \\    many (utils, hooks, logic)
\`\`\`

## Unit Tests — Logic & Hooks

### Utils
\`\`\`js
import { describe, test, expect } from 'vitest';
test('formatPrice', () => {
  expect(formatPrice(1000)).toBe('$1,000');
});
\`\`\`

### Hooks (React Testing Library)
\`\`\`js
import { renderHook, act } from '@testing-library/react';
test('useCounter', () => {
  const { result } = renderHook(() => useCounter(0));
  act(() => result.current.inc());
  expect(result.current.count).toBe(1);
});
\`\`\`

## Integration — Components + Collaboration

### React Testing Library Philosophy
Test **behavior, not implementation**. Query by what user sees.
\`\`\`jsx
import { render, screen, userEvent } from '@testing-library/react';

test('login flow', async () => {
  render(<LoginForm />);
  await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/password/i), 'pass');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText(/welcome/i)).toBeInTheDocument();
});
\`\`\`

### Query Priority (RTL)
1. getByRole (most accessible)
2. getByLabelText
3. getByPlaceholderText
4. getByText
5. getByDisplayValue
6. getByAltText
7. getByTitle
8. getByTestId (last resort)

## Mock API (MSW)
Mock Service Worker — intercepts fetch at network level. Same handlers for dev, test, E2E.

\`\`\`js
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

const server = setupServer(
  http.get('/api/user', () => HttpResponse.json({ name: 'Alex' }))
);
beforeAll(() => server.listen());
afterAll(() => server.close());
\`\`\`

## E2E — Playwright (recommended) / Cypress

\`\`\`js
import { test, expect } from '@playwright/test';

test('user signs up', async ({ page }) => {
  await page.goto('/signup');
  await page.fill('input[name=email]', 'a@b.com');
  await page.fill('input[name=password]', 'longenough');
  await page.click('button[type=submit]');
  await expect(page).toHaveURL('/dashboard');
});
\`\`\`

Playwright advantages:
- Multi-browser (Chromium, Firefox, WebKit)
- Parallel by default
- Auto-waiting (no flaky \`wait\` calls)
- Trace viewer for debugging
- Better than Cypress for modern use

## Visual Regression
Compare screenshots across builds.
- **Chromatic** (Storybook-integrated)
- **Percy**
- **Playwright's built-in** screenshot comparison

## Coverage Trap
100% coverage ≠ bug-free. Better to:
- Use mutation testing (Stryker) — does test catch injected bugs?
- Focus on critical paths, edge cases`,
  },
  {
    id: "fe-animation",
    cat: "Architecture",
    n: "Animation & Graphics (Framer Motion, Canvas, WebGL)",
    s: "Smooth 60fps UI animation + low-level graphics.",
    depth: "medium",
    level: "L3",
    detail: `## CSS Transitions & Animations
Best for simple hover/state changes.
\`\`\`css
.button {
  transition: transform 0.2s, background 0.2s;
}
.button:hover { transform: scale(1.05); }

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
.modal { animation: slideIn 0.3s ease-out; }
\`\`\`

**Always animate \`transform\` and \`opacity\`** — GPU-accelerated, no layout/paint.
Avoid animating \`width\`, \`height\`, \`top\`, \`left\` — triggers layout.

## Web Animations API (WAAPI)
JS-controlled, better than CSS for dynamic sequences.
\`\`\`js
element.animate(
  [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }],
  { duration: 300, iterations: Infinity, direction: 'alternate' }
);
\`\`\`

## Framer Motion (React)
Declarative, gesture-aware, spring-based.
\`\`\`jsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
/>

<motion.div
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  drag="x"
/>
\`\`\`

### Layout Animations (magic)
\`\`\`jsx
<motion.li layoutId="card" />
// Framer handles FLIP animation when layout changes
\`\`\`

## requestAnimationFrame
Schedule work before next paint (60fps = every 16.67ms).
\`\`\`js
function animate() {
  // update position
  requestAnimationFrame(animate);
}
animate();
\`\`\`

## Canvas 2D
For custom drawings, games, charts.
\`\`\`js
const ctx = canvas.getContext('2d');
ctx.fillStyle = 'tomato';
ctx.fillRect(10, 10, 100, 100);
ctx.beginPath();
ctx.arc(200, 50, 30, 0, Math.PI * 2);
ctx.fill();
\`\`\`

## SVG
For icons, diagrams, data viz.
\`\`\`jsx
<svg viewBox="0 0 100 100">
  <circle cx="50" cy="50" r="40" fill="tomato" />
</svg>
\`\`\`
D3.js, Recharts are SVG-based.

## WebGL (3D & high-perf 2D)
Low-level GPU access. Usually via **Three.js** (easier abstraction).
\`\`\`js
import * as THREE from 'three';
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w/h, 0.1, 1000);
const cube = new THREE.Mesh(geom, material);
scene.add(cube);
renderer.render(scene, camera);
\`\`\`

Used for: 3D product viewers, games, data viz, AR/VR.

## WebGPU (successor to WebGL)
Modern, based on Vulkan/Metal/DirectX 12 concepts. Supported in Chrome.

## Performance
- Avoid layout thrashing (batch reads/writes)
- Use \`will-change: transform\` sparingly (creates new composite layer)
- For lists of animated items, virtualize
- Profile with Chrome DevTools Performance panel — look for frame drops`,
  },
  {
    id: "fe-state-mgmt",
    cat: "React",
    n: "State Management (Zustand, Redux, Jotai, Recoil, TanStack Query)",
    s: "Local, global, server-state patterns.",
    depth: "medium",
    level: "L2",
    detail: `## Categories of State

### 1. Local UI state → \`useState\`, \`useReducer\`
Form inputs, toggle state, modal open.

### 2. Derived state → computed, \`useMemo\`
Don't store; derive from source of truth.

### 3. Server cache state → TanStack Query, SWR
Data from your API. Cache + revalidation + background sync.

### 4. Client global state → Zustand, Redux, Jotai
User auth, theme, cart, sidebar.

### 5. URL state → React Router, Next.js, nuqs
Filters, search, selected tab. Shareable.

## Redux Toolkit
Traditional, explicit actions + reducers.

\`\`\`js
import { createSlice, configureStore } from '@reduxjs/toolkit';

const counterSlice = createSlice({
  name: 'counter',
  initialState: { value: 0 },
  reducers: {
    increment: (s) => { s.value++; },  // Immer handles immutability
    incrementByAmount: (s, a) => { s.value += a.payload; },
  },
});
\`\`\`

Pros: Mature, DevTools, predictable, large ecosystem.
Cons: Boilerplate, vertical learning curve.

## Zustand
Lightweight. No boilerplate. Just hooks.
\`\`\`js
import { create } from 'zustand';

const useStore = create((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
}));

// Component
const count = useStore((s) => s.count);
const inc = useStore((s) => s.inc);
\`\`\`
Fine-grained subscription (only re-render if selected slice changes).

## Jotai
Atomic state, like Recoil.
\`\`\`js
const countAtom = atom(0);
const doubledAtom = atom((get) => get(countAtom) * 2);

function App() {
  const [count, setCount] = useAtom(countAtom);
  const doubled = useAtomValue(doubledAtom);
}
\`\`\`
Atoms are primitives; you compose them.

## TanStack Query (Server State)
Manages async data — cache, loading, error states, background refetch.
\`\`\`js
const { data, isLoading, error } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetch(\`/api/users/\${userId}\`).then(r => r.json()),
  staleTime: 60_000,
});
\`\`\`

**Rule:** server state doesn't belong in Redux. Use a server-state library.

## When to Pick What
- Small app → \`useState\` + context
- Medium → Zustand + TanStack Query
- Complex + team experience → Redux Toolkit + TanStack Query
- Async-heavy → TanStack Query handles most
- Form-heavy → React Hook Form + Zod`,
  },
];
