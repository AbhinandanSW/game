// Rich per-day content for the 30-day plans.
// Each day has: fullTheory (deep content), problems (specific LC numbers),
// eveningSpec (detailed task), resources (links), successCriteria (checklist).

export const FE_PLAN_DETAIL = {
  1: {
    fullTheory: `## Execution Context, Call Stack, Hoisting, TDZ

### Execution Context
Every function call creates an execution context containing:
- **Variable Environment** — var declarations, function declarations
- **Lexical Environment** — let, const, block scope
- **This binding** — depends on how function is called
- **Outer reference** — closure scope chain

### Call Stack
LIFO stack of execution contexts. Max depth ~10,000 in Chrome.
\`\`\`js
function a() { b(); }
function b() { c(); }
function c() { console.trace(); }
a();
// Stack: [global, a, b, c] when trace runs
\`\`\`

### Hoisting
Declarations moved to top of scope, but NOT assignments.
\`\`\`js
console.log(x); // undefined (hoisted)
var x = 5;

console.log(y); // ReferenceError (TDZ)
let y = 5;
\`\`\`

### TDZ (Temporal Dead Zone)
\`let\`/\`const\` are hoisted but uninitialized until declaration. Accessing = error.

### Scope Chain
Inner functions can access outer scope. Resolved via Lexical Environments.
\`\`\`js
const x = 1;
function outer() {
  const y = 2;
  function inner() { return x + y; } // Accesses outer scopes
  return inner();
}
\`\`\``,
    problems: [
      { lc: 1, n: "Two Sum", diff: "Easy" },
      { lc: 53, n: "Maximum Subarray", diff: "Medium" },
      { lc: 21, n: "Merge Two Sorted Lists", diff: "Easy" },
      { lc: 189, n: "Rotate Array", diff: "Medium" },
    ],
    eveningSpec: `## Polyfill Exercises

Implement these 4 polyfills. No lodash, no external libraries.

### 1. Array.prototype.myMap
\`\`\`js
Array.prototype.myMap = function(callback, thisArg) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) result[i] = callback.call(thisArg, this[i], i, this);
  }
  return result;
};
\`\`\`

### 2. myFilter, myReduce, myForEach
Apply similar patterns. Reduce requires handling no-initial-value case.

### Edge cases to test
- Sparse arrays: \`[1, , 3].myMap(x => x * 2)\` — don't invoke on holes
- thisArg: \`arr.myMap(cb, obj)\`
- Reduce with/without initial value`,
    resources: [
      { label: "MDN: Execution context", url: "https://developer.mozilla.org/en-US/docs/Glossary/Execution_context" },
      { label: "Kyle Simpson: YDKJS Scope & Closures", url: "https://github.com/getify/You-Dont-Know-JS" },
      { label: "JavaScript.info: Variable scope", url: "https://javascript.info/closure" },
    ],
    successCriteria: [
      "Can explain what TDZ is and when it applies",
      "Can trace call stack for nested function calls",
      "All 4 polyfills pass 10+ test cases",
      "Solved 4 DSA problems with explanation",
    ],
  },
  2: {
    fullTheory: `## Closures & Module Pattern

### What is a Closure
A function bundled with references to its surrounding lexical environment.

\`\`\`js
function makeCounter() {
  let count = 0;  // Private state
  return {
    inc: () => ++count,
    get: () => count,
    reset: () => count = 0,
  };
}
const c = makeCounter();
c.inc(); c.inc(); c.get(); // 2
\`\`\`

### Use Cases
1. **Private state** (module pattern)
2. **Memoization** — cache results
3. **Partial application** — bind, curry
4. **Event handlers** — remember context
5. **Iterators** — state machines

### The var vs let loop
\`\`\`js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 3, 3, 3 — shared i

for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100);
}
// 0, 1, 2 — new binding per iteration
\`\`\`

### Memory Leaks
Closures hold references → objects not garbage collected.
Common in event listeners never removed.

### IIFE (historical)
\`\`\`js
(function() {
  var private = 'hidden';
  // ...
})();
\`\`\`
Obsolete with ES modules, but know it for legacy code.`,
    problems: [
      { lc: 242, n: "Valid Anagram", diff: "Easy" },
      { lc: 3, n: "Longest Substring Without Repeating", diff: "Medium" },
      { lc: 125, n: "Valid Palindrome", diff: "Easy" },
      { lc: 5, n: "Longest Palindromic Substring", diff: "Medium" },
    ],
    eveningSpec: `## Build debounce() and throttle()

### Debounce — wait N ms after last call
\`\`\`js
function debounce(fn, wait, { leading = false, trailing = true } = {}) {
  let timer = null, lastArgs = null, lastThis = null;
  return function(...args) {
    lastArgs = args; lastThis = this;
    const callNow = leading && !timer;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (trailing && !callNow) fn.apply(lastThis, lastArgs);
    }, wait);
    if (callNow) fn.apply(this, args);
  };
}
\`\`\`

### Throttle — execute at most once per N ms
Fire first, block until interval passes, queue trailing if needed.

### Tests
- Rapid-fire 100 calls in 50ms → debounce fires 1x, throttle fires ceil(50/wait)x
- Leading-only vs trailing-only options
- Async callback handling`,
    resources: [
      { label: "David Walsh: Throttle vs Debounce", url: "https://davidwalsh.name/javascript-debounce-function" },
      { label: "CSS-Tricks: Debouncing and Throttling", url: "https://css-tricks.com/debouncing-throttling-explained-examples/" },
    ],
    successCriteria: [
      "Can explain closure via 'every execution = new scope'",
      "debounce + throttle both with leading/trailing edge",
      "Tested against lodash implementations",
    ],
  },
  3: {
    fullTheory: `## this & Prototypal Inheritance

### The 4 Rules of \`this\`
1. **new** — \`new Foo()\` → this = new instance
2. **Explicit** — call/apply/bind → this = first arg
3. **Implicit** — \`obj.method()\` → this = obj
4. **Default** — bare call → globalThis or undefined (strict)

Arrow functions: no own \`this\`, lexical.

### Prototype Chain
\`\`\`js
function Animal(name) { this.name = name; }
Animal.prototype.speak = function() { return this.name; };

function Dog(name) { Animal.call(this, name); }
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;

const d = new Dog('Rex');
// d → Dog.prototype → Animal.prototype → Object.prototype → null
\`\`\`

### ES6 Classes (syntactic sugar)
\`\`\`js
class Animal {
  constructor(name) { this.name = name; }
  speak() { return this.name; }
}
class Dog extends Animal {
  bark() { return 'woof'; }
}
\`\`\`
Under the hood: same prototype chain.

### Object.create
Create object with specified prototype.
\`\`\`js
const proto = { greet() { return 'hi'; } };
const obj = Object.create(proto);
obj.greet(); // 'hi'
\`\`\``,
    problems: [
      { lc: 206, n: "Reverse Linked List", diff: "Easy" },
      { lc: 141, n: "Linked List Cycle", diff: "Easy" },
      { lc: 21, n: "Merge Two Sorted Lists", diff: "Easy" },
      { lc: 876, n: "Middle of Linked List", diff: "Easy" },
    ],
    eveningSpec: `## Build call, apply, bind, new polyfills

### myCall
\`\`\`js
Function.prototype.myCall = function(context, ...args) {
  context = context || globalThis;
  const key = Symbol();
  context[key] = this;
  const result = context[key](...args);
  delete context[key];
  return result;
};
\`\`\`

### myBind
Must support:
- Partial application
- new binding (hard mode)
\`\`\`js
Function.prototype.myBind = function(ctx, ...preArgs) {
  const fn = this;
  function bound(...args) {
    const isNew = this instanceof bound;
    return fn.apply(isNew ? this : ctx, [...preArgs, ...args]);
  }
  bound.prototype = Object.create(fn.prototype);
  return bound;
};
\`\`\`

### myNew
\`\`\`js
function myNew(Constructor, ...args) {
  const obj = Object.create(Constructor.prototype);
  const result = Constructor.apply(obj, args);
  return (result && typeof result === 'object') ? result : obj;
}
\`\`\``,
    resources: [
      { label: "YDKJS: this & Object Prototypes", url: "https://github.com/getify/You-Dont-Know-JS/blob/1st-ed/this%20%26%20object%20prototypes/README.md" },
      { label: "MDN: Inheritance", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain" },
    ],
    successCriteria: [
      "All 4 polyfills working",
      "Can explain each this binding rule with example",
      "Understand prototype chain for ES6 classes",
    ],
  },
  4: {
    fullTheory: `## Event Loop & Async Deep Dive

### Microtasks vs Macrotasks
**Microtasks** (higher priority):
- Promise.then/catch/finally
- queueMicrotask
- MutationObserver

**Macrotasks**:
- setTimeout, setInterval
- I/O, UI events
- MessageChannel

### Event Loop Algorithm
1. Run sync code (call stack)
2. When stack empty, drain ALL microtasks
3. Run ONE macrotask
4. Drain microtasks again
5. Render (browser)
6. Repeat

### Classic Question
\`\`\`js
console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');
// Output: 1, 4, 3, 2
\`\`\`

### Promise Internals
Three states: pending → fulfilled | rejected. Immutable once settled.

\`\`\`js
const p = new Promise((resolve, reject) => {
  resolve(1);  // state = fulfilled, value = 1
  reject(2);   // ignored (already settled)
});
\`\`\`

### async/await Error Handling
\`\`\`js
async function safe() {
  try {
    const r = await risky();
  } catch (e) {
    // handles both thrown + rejected
  }
}
\`\`\``,
    problems: [
      { lc: 20, n: "Valid Parentheses", diff: "Easy" },
      { lc: 155, n: "Min Stack", diff: "Medium" },
      { lc: 150, n: "Evaluate Reverse Polish Notation", diff: "Medium" },
      { lc: 739, n: "Daily Temperatures", diff: "Medium" },
    ],
    eveningSpec: `## Build a Custom Promise from Scratch

\`\`\`js
class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.handlers = [];
    const resolve = (v) => this._settle('fulfilled', v);
    const reject = (e) => this._settle('rejected', e);
    try { executor(resolve, reject); }
    catch (e) { reject(e); }
  }
  _settle(state, value) {
    if (this.state !== 'pending') return;
    this.state = state;
    this.value = value;
    queueMicrotask(() => this.handlers.forEach(h => this._call(h)));
  }
  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const handler = { onFulfilled, onRejected, resolve, reject };
      if (this.state === 'pending') this.handlers.push(handler);
      else queueMicrotask(() => this._call(handler));
    });
  }
  _call(h) { /* handle the chain — implement */ }
}
\`\`\`

### Tests
- \`new MyPromise((res) => res(1)).then(v => v + 1).then(console.log)\` → 2
- Rejection propagates through \`.then\` chain to \`.catch\`
- Async resolve via setTimeout
- Chaining returns new Promise`,
    resources: [
      { label: "Promises/A+ spec", url: "https://promisesaplus.com/" },
      { label: "JakeArchibald: Tasks, microtasks, queues", url: "https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/" },
    ],
    successCriteria: [
      "Custom Promise passes Promises/A+ tests (at least basic ones)",
      "Can predict output of mixed sync/micro/macro code",
      "Understand difference between Node event loop phases and browser",
    ],
  },
  5: {
    fullTheory: `## ES6+ Features & Modules

### Generators & Iterators
\`\`\`js
function* range(start, end, step = 1) {
  for (let i = start; i < end; i += step) yield i;
}
[...range(0, 10, 2)]; // [0, 2, 4, 6, 8]
\`\`\`

\`Symbol.iterator\` makes objects iterable:
\`\`\`js
const obj = {
  [Symbol.iterator]() {
    let i = 0;
    return { next: () => ({ value: i, done: i++ >= 3 }) };
  }
};
[...obj]; // [0, 1, 2]
\`\`\`

### Symbols
Unique primitives — collision-free property keys.
\`\`\`js
const privKey = Symbol('secret');
obj[privKey] = 'hidden';
\`\`\`

### Proxy & Reflect
Meta-programming — intercept all object operations.
\`\`\`js
const p = new Proxy(target, {
  get: (t, k) => { console.log('read', k); return t[k]; },
  set: (t, k, v) => { t[k] = v; return true; },
});
\`\`\`
Used by: Vue 3 reactivity, Immer.

### WeakMap / WeakSet
Keys weakly held — GC-friendly caches for object metadata.

### ESM vs CommonJS
\`\`\`js
// ESM — static, tree-shakable
import { thing } from './mod.js';
export const foo = 1;

// CJS — dynamic, no tree shaking
const { thing } = require('./mod');
module.exports = { foo };
\`\`\``,
    problems: [
      { lc: 78, n: "Subsets", diff: "Medium" },
      { lc: 46, n: "Permutations", diff: "Medium" },
      { lc: 39, n: "Combination Sum", diff: "Medium" },
      { lc: 51, n: "N-Queens", diff: "Hard" },
    ],
    eveningSpec: `## Event Emitter

\`\`\`js
class EventEmitter {
  constructor() { this.listeners = new Map(); }

  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.off(event, fn);  // Unsubscribe fn
  }

  off(event, fn) {
    this.listeners.get(event)?.delete(fn);
  }

  emit(event, ...args) {
    this.listeners.get(event)?.forEach(fn => fn(...args));
  }

  once(event, fn) {
    const wrap = (...args) => { fn(...args); this.off(event, wrap); };
    return this.on(event, wrap);
  }
}
\`\`\`

### Tests
- on → emit → fires
- off removes listener
- once fires exactly once
- emit with no listeners doesn't throw
- Multiple listeners on same event
- Unsubscribe during emit (common bug)`,
    resources: [
      { label: "MDN: Iterators and Generators", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Iterators_and_generators" },
      { label: "MDN: Proxy", url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy" },
    ],
    successCriteria: [
      "Event Emitter with on/off/emit/once",
      "Can use generator for lazy sequences",
      "Understand when Proxy is appropriate",
    ],
  },
  6: {
    fullTheory: `## DOM & Browser APIs

### DOM Traversal
\`\`\`js
node.parentElement, node.children, node.firstElementChild, node.nextElementSibling
document.querySelector('.class'); document.querySelectorAll('div > a');
\`\`\`

### Event Phases
1. **Capture** — top down
2. **Target** — at element
3. **Bubble** — bottom up (default)

\`\`\`js
el.addEventListener('click', handler, { capture: true });  // capture phase
el.addEventListener('click', handler);  // bubble phase (default)
\`\`\`

### Event Delegation
Instead of N listeners, one on parent:
\`\`\`js
list.addEventListener('click', (e) => {
  if (e.target.matches('.item')) handleItem(e.target);
});
\`\`\`

### IntersectionObserver
Know when element enters viewport.
\`\`\`js
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) loadMore();
  });
}, { rootMargin: '200px' });
io.observe(sentinel);
\`\`\`

### MutationObserver
Watch DOM changes.
\`\`\`js
const mo = new MutationObserver((mutations) => {
  mutations.forEach(m => console.log(m.type, m.target));
});
mo.observe(node, { childList: true, subtree: true });
\`\`\`

### ResizeObserver
Element size changes without polling.`,
    problems: [
      { lc: 104, n: "Max Depth of BT", diff: "Easy" },
      { lc: 226, n: "Invert BT", diff: "Easy" },
      { lc: 102, n: "Level Order Traversal", diff: "Medium" },
      { lc: 98, n: "Validate BST", diff: "Medium" },
    ],
    eveningSpec: `## Infinite Scroll + Virtualized List

Build a React component that:
1. Loads 20 items per page
2. Uses IntersectionObserver to detect scroll end
3. Virtualizes off-screen items (using react-virtual or manual)
4. Handles loading + error states
5. Preserves scroll position on prev/next nav

### Skeleton
\`\`\`jsx
function InfiniteList({ fetcher }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && !loading) {
        setLoading(true);
        const next = await fetcher(items.length, 20);
        setItems(prev => [...prev, ...next]);
        setLoading(false);
      }
    });
    if (sentinelRef.current) io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [items.length, loading]);

  return (
    <>
      {items.map(i => <div key={i.id}>{i.title}</div>)}
      <div ref={sentinelRef} />
      {loading && <Spinner />}
    </>
  );
}
\`\`\``,
    resources: [
      { label: "MDN: IntersectionObserver", url: "https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API" },
      { label: "TanStack Virtual", url: "https://tanstack.com/virtual" },
    ],
    successCriteria: [
      "Infinite scroll works on 10k+ items without lag",
      "Can explain event bubbling/capture/stopPropagation",
      "Know when to use IO vs scroll event",
    ],
  },
  7: {
    fullTheory: `## Week 1 Revision Day

Spend the morning consolidating week 1 into **cheat sheets**:
1. JS execution: stack, hoisting, TDZ, scope chain
2. Closures: use cases, memory implications
3. this: 4 rules + arrow
4. Prototypes: chain, ES6 classes as sugar
5. Promises/async: microtasks, error handling
6. ES6+: generators, proxy, symbols
7. DOM: delegation, observers

### Technique: Feynman
Explain each concept as if teaching to a non-programmer. If you stumble, you don't understand yet.`,
    problems: [
      { lc: 76, n: "Min Window Substring", diff: "Hard" },
      { lc: 239, n: "Sliding Window Maximum", diff: "Hard" },
      { lc: 146, n: "LRU Cache", diff: "Medium" },
      { lc: 295, n: "Find Median from Data Stream", diff: "Hard" },
      { lc: 56, n: "Merge Intervals", diff: "Medium" },
    ],
    eveningSpec: `Take the outputs from days 1-6 (polyfills, debounce, promise, event emitter, infinite scroll). Refactor each:
- Remove magic numbers
- Add JSDoc types
- Write README
- Add unit tests (vitest)

Make them portfolio-ready.`,
    resources: [
      { label: "Spaced repetition: Anki", url: "https://apps.ankiweb.net/" },
      { label: "Feynman technique", url: "https://fs.blog/feynman-technique/" },
    ],
    successCriteria: [
      "7 topics summarized in ≤ 500 words each",
      "All 6 utilities polished with tests",
      "Solved 5 problems under 45 min each",
    ],
  },
  8: {
    fullTheory: `## React Core: Virtual DOM, Reconciliation, Fiber

### Why Virtual DOM
Direct DOM ops trigger layout + paint. React diffs virtual tree, batches real DOM writes.

### Reconciliation (the diff algorithm)
1. Different root types → full rebuild
2. Same type → update props, recurse children
3. Lists → match by key

### Fiber (React 16+)
- Work units that can be paused, resumed, prioritized
- Two phases: Render (pausable) → Commit (sync)
- Enables Concurrent features (Suspense, transitions)

### JSX
\`<div />\` compiles to \`React.createElement('div')\` which returns a lightweight object — the virtual node.

### Keys
CRITICAL for list stability.
\`\`\`jsx
// Bad — index changes on reorder
{items.map((it, i) => <Row key={i} />)}
// Good
{items.map(it => <Row key={it.id} />)}
\`\`\``,
    problems: [
      { lc: 49, n: "Group Anagrams", diff: "Medium" },
      { lc: 347, n: "Top K Frequent", diff: "Medium" },
      { lc: 146, n: "LRU Cache", diff: "Medium" },
      { lc: 128, n: "Longest Consecutive Sequence", diff: "Medium" },
    ],
    eveningSpec: `## Todo App

### Requirements
- Add todo (Enter key)
- Toggle complete (click checkbox)
- Edit inline (double-click)
- Delete
- Filter: All / Active / Completed
- Clear completed button
- Persist in localStorage
- Show counts: X remaining

### Architecture
- useState for todos + filter
- useEffect to sync localStorage
- Keyboard support (Enter/Escape)

### Bonus
- Drag to reorder
- Undo last action`,
    resources: [
      { label: "React docs: Conditional rendering", url: "https://react.dev/learn/conditional-rendering" },
      { label: "Acdlite: React Fiber architecture", url: "https://github.com/acdlite/react-fiber-architecture" },
    ],
    successCriteria: [
      "Todo app works as spec",
      "No unnecessary re-renders (check with Profiler)",
      "Accessible (keyboard + screen reader)",
    ],
  },
  9: {
    fullTheory: `## Hooks Deep Dive

### useState Internals
Each fiber has a linked list of hook state. Order matters.
\`\`\`js
// Simplified
function useState(initial) {
  const hook = currentFiber.hooks[hookIndex++] || { state: initial };
  return [hook.state, (v) => { hook.state = typeof v === 'function' ? v(hook.state) : v; rerender(); }];
}
\`\`\`

### useEffect Cleanup
\`\`\`jsx
useEffect(() => {
  const id = setInterval(tick, 1000);
  return () => clearInterval(id);  // Cleanup on unmount or deps change
}, [/* deps */]);
\`\`\`

### useRef vs useState
- useRef — mutable, doesn't trigger re-render
- useState — immutable, triggers re-render

Use ref for: DOM refs, timers, "previous value"

### Custom Hooks
Convention: \`useXxx\`. Can call other hooks. Composable.

\`\`\`js
function useDebounce(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}
\`\`\``,
    problems: [
      { lc: 912, n: "Sort Array (Merge Sort)", diff: "Medium" },
      { lc: 148, n: "Sort List", diff: "Medium" },
      { lc: 88, n: "Merge Sorted Array", diff: "Easy" },
      { lc: 215, n: "Kth Largest Element", diff: "Medium" },
    ],
    eveningSpec: `## Build 4 Custom Hooks

1. **useDebounce(value, delay)** — debounced value
2. **usePrevious(value)** — prev value from last render
3. **useLocalStorage(key, initial)** — state synced to localStorage
4. **useFetch(url)** — { data, loading, error, refetch }

### useFetch example
\`\`\`js
function useFetch(url) {
  const [state, setState] = useState({ loading: true });
  const refetch = useCallback(async () => {
    setState({ loading: true });
    try {
      const r = await fetch(url);
      const data = await r.json();
      setState({ data, loading: false });
    } catch (error) {
      setState({ error, loading: false });
    }
  }, [url]);
  useEffect(() => { refetch(); }, [refetch]);
  return { ...state, refetch };
}
\`\`\`

### Gotchas
- Cleanup on unmount (race conditions)
- AbortController for cancellation
- Stable dep arrays (useCallback)`,
    resources: [
      { label: "React docs: Custom Hooks", url: "https://react.dev/learn/reusing-logic-with-custom-hooks" },
      { label: "usehooks.com", url: "https://usehooks.com/" },
    ],
    successCriteria: ["4 hooks with tests", "Can explain rules of hooks", "Understand closure pitfalls in hooks"],
  },
  10: {
    fullTheory: `## State Management: Context, useReducer, Zustand

### Context — Built-in Global State
\`\`\`jsx
const ThemeContext = createContext();
function App() {
  return <ThemeContext.Provider value="dark"><Page /></ThemeContext.Provider>;
}
function Page() { const theme = useContext(ThemeContext); }
\`\`\`

### Pitfall: All Consumers Re-render
Context has no selector. Split contexts by concern.

### useReducer — Structured Updates
\`\`\`js
function reducer(state, action) {
  switch(action.type) {
    case 'ADD': return { ...state, items: [...state.items, action.item] };
    case 'REMOVE': return { ...state, items: state.items.filter(i => i.id !== action.id) };
    default: return state;
  }
}
const [state, dispatch] = useReducer(reducer, initialState);
\`\`\`

### Zustand — Zero-boilerplate
\`\`\`js
const useStore = create((set) => ({
  count: 0,
  inc: () => set(s => ({ count: s.count + 1 })),
}));
// Fine-grained subscription: only re-render if count changes
const count = useStore(s => s.count);
\`\`\`

### When to Pick
- Local state → useState
- Complex local state → useReducer
- Shared state few places → Context + useReducer
- Shared state many places / high-freq updates → Zustand or Redux Toolkit
- Server cache → TanStack Query (never mix with client state libs)`,
    problems: [
      { lc: 33, n: "Search in Rotated Sorted Array", diff: "Medium" },
      { lc: 162, n: "Find Peak Element", diff: "Medium" },
      { lc: 74, n: "Search 2D Matrix", diff: "Medium" },
      { lc: 875, n: "Koko Eating Bananas", diff: "Medium" },
    ],
    eveningSpec: `## Shopping Cart with Context + useReducer

### Features
- Add item (increment if exists)
- Remove item
- Update quantity
- Apply promo code (10% off)
- Clear cart
- Computed totals (subtotal, discount, total)
- Persist in localStorage

### Architecture
- CartContext holds { state, dispatch }
- Components use useContext to read, dispatch to update
- Derived state via useMemo

### State Shape
\`\`\`js
{
  items: [{ id, name, price, qty }],
  promo: null | { code, discount },
}
\`\`\``,
    resources: [
      { label: "React docs: useReducer", url: "https://react.dev/reference/react/useReducer" },
      { label: "Zustand", url: "https://github.com/pmndrs/zustand" },
    ],
    successCriteria: ["Cart fully functional + persisted", "Understand useContext re-render gotcha", "Can explain reducer pattern"],
  },
  // Days 11-14: condensed for brevity but structured the same way
  11: {
    fullTheory: `## React Performance

### React.memo
Skip re-render if props shallow-equal.
Won't help if you pass inline functions/objects as props → use useCallback/useMemo.

### useMemo
Cache expensive computation.
\`\`\`js
const sorted = useMemo(() => items.sort(cmp), [items]);
\`\`\`

### useCallback
Stable function reference across renders — essential for memoized children.

### Code Splitting
\`\`\`js
const Heavy = React.lazy(() => import('./Heavy'));
<Suspense fallback={<Spinner />}><Heavy /></Suspense>
\`\`\`

### Profiling
React DevTools Profiler — find slow components. Look for:
- Many re-renders on unrelated update
- Expensive renders (>16ms to stay at 60fps)`,
    problems: [
      { lc: 200, n: "Number of Islands", diff: "Medium" },
      { lc: 133, n: "Clone Graph", diff: "Medium" },
      { lc: 207, n: "Course Schedule", diff: "Medium" },
      { lc: 994, n: "Rotting Oranges", diff: "Medium" },
    ],
    eveningSpec: `## Data Table with Sort / Filter / Pagination

### Features
- 1000+ rows virtualized
- Click column header to sort
- Per-column text filter
- Global search
- Pagination (client-side)
- Row selection (checkbox)
- Export selected to CSV

### Performance
- Use useMemo for sorted/filtered rows
- Virtualize with react-virtual
- Debounce search input`,
    resources: [
      { label: "React docs: Profiler", url: "https://react.dev/reference/react/Profiler" },
      { label: "Why Did You Render", url: "https://github.com/welldone-software/why-did-you-render" },
    ],
    successCriteria: ["1000 rows scrolls smooth", "No unnecessary re-renders on filter"],
  },
  12: {
    fullTheory: `## React Patterns (HOC, Render Props, Compound Components, Controlled/Uncontrolled, Portals)

### HOC
Function that takes component, returns new component.
\`\`\`js
const withAuth = (C) => (props) => user ? <C {...props} /> : <Login />;
\`\`\`

### Render Props (mostly replaced by hooks)
\`\`\`jsx
<Mouse>{({x, y}) => <Cursor x={x} y={y}/>}</Mouse>
\`\`\`

### Compound Components
\`\`\`jsx
<Tabs>
  <Tabs.List>
    <Tabs.Tab>One</Tabs.Tab>
    <Tabs.Tab>Two</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel>Content 1</Tabs.Panel>
</Tabs>
\`\`\`

### Controlled vs Uncontrolled
- Controlled: React owns state (\`value + onChange\`)
- Uncontrolled: DOM owns state (use ref to read)

### Portals
Render outside the parent DOM tree (modals, tooltips):
\`\`\`jsx
return ReactDOM.createPortal(<Modal />, document.getElementById('modal-root'));
\`\`\``,
    problems: [
      { lc: 70, n: "Climbing Stairs", diff: "Easy" },
      { lc: 322, n: "Coin Change", diff: "Medium" },
      { lc: 1143, n: "LCS", diff: "Medium" },
      { lc: 300, n: "LIS", diff: "Medium" },
    ],
    eveningSpec: "Build Multi-step Form wizard: step navigation, per-step validation, progress bar, back/next, state persists across steps.",
    resources: [
      { label: "React patterns", url: "https://reactpatterns.com/" },
    ],
    successCriteria: ["Form wizard with 4+ steps", "Validation per step"],
  },
  13: {
    fullTheory: `## Routing + SSR/CSR/SSG

### React Router
\`\`\`jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Home/>} />
    <Route path="/user/:id" element={<User/>} />
  </Routes>
</BrowserRouter>
\`\`\`

### Nested routes + outlet
Layout component with \`<Outlet />\` renders child route content.

### SSR vs CSR vs SSG vs ISR
| | SSR | CSR | SSG | ISR |
|---|---|---|---|---|
| Render | Per request | Client | Build time | Build + revalidate |
| Speed | Fast first paint | Slow first | Fastest | Fast |
| Scalability | Expensive | Free | Free | Cheap |

### Hydration
Client takes over server-rendered HTML. Mismatch = React re-renders and warns.

### Use Cases
- Marketing → SSG
- Dashboard → CSR (or SSR if auth-gated)
- Product page → SSG + ISR
- Social feed → SSR + streaming`,
    problems: [
      { lc: 208, n: "Implement Trie", diff: "Medium" },
      { lc: 215, n: "Kth Largest", diff: "Medium" },
      { lc: 23, n: "Merge K Sorted Lists", diff: "Hard" },
      { lc: 295, n: "Median from Stream", diff: "Hard" },
    ],
    eveningSpec: "Star Rating + Autocomplete components. Full keyboard support, accessible, debounced search.",
    resources: [
      { label: "React Router docs", url: "https://reactrouter.com/" },
      { label: "Next.js rendering", url: "https://nextjs.org/docs/app/building-your-application/rendering" },
    ],
    successCriteria: ["Both components fully keyboard-accessible"],
  },
  14: {
    fullTheory: "Revise all React topics. Revisit fiber + reconciliation articles. Explain to a peer.",
    problems: [
      { lc: 124, n: "BT Max Path Sum", diff: "Hard" },
      { lc: 297, n: "Serialize/Deserialize BT", diff: "Hard" },
      { lc: 42, n: "Trapping Rain Water", diff: "Hard" },
      { lc: 72, n: "Edit Distance", diff: "Hard" },
      { lc: 76, n: "Min Window Substring", diff: "Hard" },
    ],
    eveningSpec: "Mock machine coding: build Kanban Board in 90 min. Drag-drop cards between columns.",
    resources: [],
    successCriteria: ["Kanban done in 90 min without looking things up"],
  },
  15: {
    fullTheory: `## CSS Mastery

### Box Model
\`margin\` | \`border\` | \`padding\` | \`content\`
Use \`box-sizing: border-box\` globally.

### BFC (Block Formatting Context)
Isolated layout region. Triggered by: float, overflow:hidden, display:flow-root.
Contains floats, prevents margin collapse.

### Flexbox — 1D
\`justify-content\` on main axis, \`align-items\` on cross axis.

### Grid — 2D
\`grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))\` — responsive without media queries.

### Stacking Context
New context created by: position + z-index, opacity < 1, transform, filter.
z-index only competes within same stacking context.

### Specificity
Inline > ID > Class > Element. \`!important\` wins (avoid).`,
    problems: [
      { lc: 3, n: "Longest Substring No Repeat", diff: "Medium" },
      { lc: 424, n: "Longest Repeating Char Replacement", diff: "Medium" },
      { lc: 567, n: "Permutation in String", diff: "Medium" },
    ],
    eveningSpec: "Responsive dashboard with Grid + Flexbox. 3 sidebar + header + main grid layout. Mobile stacking.",
    resources: [
      { label: "CSS Tricks: Complete Flexbox Guide", url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/" },
      { label: "CSS Tricks: Complete Grid Guide", url: "https://css-tricks.com/snippets/css/complete-guide-grid/" },
    ],
    successCriteria: ["Dashboard responsive 320px → 1920px without media query hacks"],
  },
  16: {
    fullTheory: `## CSS Advanced Features

### Custom Properties
\`\`\`css
:root { --primary: #ff6b35; }
button { background: var(--primary); }
\`\`\`
Theme switching = change CSS var via JS.

### Container Queries
\`\`\`css
.card-container { container-type: inline-size; }
@container (min-width: 500px) { .card { display: grid; } }
\`\`\`

### :has()
\`\`\`css
form:has(input:invalid) button { opacity: 0.5; }
\`\`\`

### Animations
Transitions for simple, @keyframes for complex. Animate transform/opacity only (GPU).

### Critical CSS
Inline above-fold CSS, async-load rest. Speeds up LCP.`,
    problems: [
      { lc: 15, n: "3Sum", diff: "Medium" },
      { lc: 11, n: "Container With Most Water", diff: "Medium" },
      { lc: 42, n: "Trapping Rain Water", diff: "Hard" },
    ],
    eveningSpec: "Build 4 UI components: Accordion, Modal, Tabs, Tooltip. All keyboard + screen reader accessible.",
    resources: [
      { label: "Smashing Magazine: Container Queries", url: "https://www.smashingmagazine.com/2021/05/complete-guide-css-container-queries/" },
    ],
    successCriteria: ["All 4 components WCAG AA compliant"],
  },
  17: {
    fullTheory: `## Web Performance & Core Web Vitals

### Core Web Vitals
- **LCP** ≤ 2.5s — largest element paint
- **INP** ≤ 200ms — interaction responsiveness
- **CLS** ≤ 0.1 — layout stability

### Optimization Techniques
- **LCP**: preload hero, SSR, CDN, compression
- **INP**: code splitting, Web Workers, defer non-critical JS
- **CLS**: set dims on images, avoid layout-shifting ads

### Bundle Analysis
webpack-bundle-analyzer / rollup-plugin-visualizer → find bloat.

### Tree Shaking
ES modules + side-effect-free imports.
\`package.json: "sideEffects": false\`

### Lazy Loading
\`<img loading="lazy">\`, \`React.lazy\`, dynamic imports.

### RAIL Model
- Response < 100ms
- Animation 16ms/frame
- Idle work in 50ms chunks
- Load < 1s first content`,
    problems: [
      { lc: 55, n: "Jump Game", diff: "Medium" },
      { lc: 56, n: "Merge Intervals", diff: "Medium" },
      { lc: 435, n: "Non-overlapping Intervals", diff: "Medium" },
    ],
    eveningSpec: `System Design: Chat Application (WhatsApp-like). Write up:
- Requirements
- Architecture (WebSocket, Kafka, DBs)
- Message flow
- Scaling (fanout, presence, offline queue)
Target: 60-min design doc.`,
    resources: [
      { label: "web.dev: Vitals", url: "https://web.dev/vitals/" },
      { label: "Google: Lighthouse", url: "https://developer.chrome.com/docs/lighthouse/" },
    ],
    successCriteria: ["Your portfolio site scores > 90 on Lighthouse Perf", "Design doc written"],
  },
  18: {
    fullTheory: `## Networking & Security

### HTTP/2 vs HTTP/3
- HTTP/2: multiplexed streams over TCP (head-of-line blocking at TCP)
- HTTP/3: QUIC over UDP — no HOL blocking, 0-RTT, connection migration

### HTTPS / TLS
1. Handshake (ClientHello → ServerHello → cert exchange)
2. Symmetric encryption via exchanged keys
3. Certificate validated against CA chain

### CORS
Server sends Access-Control-Allow-* headers. Preflight for non-simple requests.

### XSS / CSRF
- XSS: sanitize input, CSP header, HttpOnly cookies
- CSRF: SameSite cookies, CSRF tokens

### Cookies vs Tokens
- Cookies (HttpOnly): secure from XSS, vulnerable to CSRF
- Tokens (localStorage): vulnerable to XSS, immune to CSRF

### OAuth2 / OIDC
Authorization Code + PKCE is modern default. ID token = user identity.`,
    problems: [
      { lc: 57, n: "Insert Interval", diff: "Medium" },
      { lc: 252, n: "Meeting Rooms", diff: "Easy" },
      { lc: 253, n: "Meeting Rooms II", diff: "Medium" },
    ],
    eveningSpec: "System Design: Infinite Feed (Twitter-like). Fanout-on-write vs read. Celebrity problem.",
    resources: [
      { label: "MDN: HTTP", url: "https://developer.mozilla.org/en-US/docs/Web/HTTP" },
      { label: "OWASP Top 10", url: "https://owasp.org/www-project-top-ten/" },
    ],
    successCriteria: ["Can explain CORS preflight end-to-end", "Feed design doc covers celebrity problem"],
  },
  19: {
    fullTheory: `## Build Tools

### Webpack
Mature, configurable. Slow dev for large projects.

### Vite
ESM in dev = instant startup. Rollup for prod. Default for new apps.

### Babel vs SWC
Babel = JS, slow. SWC = Rust, 20x faster. Next.js uses SWC.

### Tree Shaking
Dead code elimination. Requires ES modules.

### HMR (Hot Module Replacement)
Module updates without full reload. Preserves state.

### Sourcemaps
Map minified code to source. devtool option controls.`,
    problems: [
      { lc: 54, n: "Spiral Matrix", diff: "Medium" },
      { lc: 73, n: "Set Matrix Zeroes", diff: "Medium" },
      { lc: 79, n: "Word Search", diff: "Medium" },
    ],
    eveningSpec: "System Design: Google Docs (collaborative editor). OT vs CRDT, WebSocket, presence.",
    resources: [
      { label: "Vite docs", url: "https://vitejs.dev/" },
    ],
    successCriteria: ["Bundle analyzed + 20% reduction via lazy loading"],
  },
  20: {
    fullTheory: `## Testing Strategies

### Unit (Jest/Vitest + RTL)
Test behavior, not implementation. Query by role/label (accessible).

### Integration (React Testing Library)
Render component + its children, interact via user-event, assert.

### E2E (Playwright)
Real browser, full stack. Slow, keep to critical paths.

### TDD: Red → Green → Refactor
1. Write failing test
2. Make it pass (minimum code)
3. Clean up

### Mocking
- MSW for network (best)
- Jest mocks for modules
- Fake timers for setTimeout

### Coverage
100% isn't the goal. Mutation testing better signal.`,
    problems: [
      { lc: 136, n: "Single Number", diff: "Easy" },
      { lc: 338, n: "Counting Bits", diff: "Easy" },
      { lc: 231, n: "Power of Two", diff: "Easy" },
    ],
    eveningSpec: "System Design: Design System / Component Library architecture. Tokens, primitives, theming, docs.",
    resources: [
      { label: "React Testing Library", url: "https://testing-library.com/docs/react-testing-library/intro/" },
    ],
    successCriteria: ["Write 5 tests for a complex component you built earlier"],
  },
  21: {
    fullTheory: "Revise CSS, performance, security, build tools. Make cheat sheets.",
    problems: [
      { lc: 239, n: "Sliding Window Max", diff: "Hard" },
      { lc: 84, n: "Largest Rectangle Histogram", diff: "Hard" },
      { lc: 127, n: "Word Ladder", diff: "Hard" },
      { lc: 212, n: "Word Search II", diff: "Hard" },
      { lc: 10, n: "Regex Matching", diff: "Hard" },
    ],
    eveningSpec: "Mock system design: E-commerce Product Page. 45 min, no looking up.",
    resources: [],
    successCriteria: ["5 Hard problems done", "Product page design coherent"],
  },
  22: {
    fullTheory: `## TypeScript

### Utility Types
Partial, Required, Readonly, Pick, Omit, Record, Extract, Exclude, NonNullable, ReturnType, Parameters.

### Generics
\`\`\`ts
function identity<T>(x: T): T { return x; }
interface ApiResponse<T> { data: T; status: number; }
\`\`\`

### Narrowing
typeof, instanceof, in, equality, user-defined type guards.

### Discriminated Unions
\`\`\`ts
type State =
  | { status: 'loading' }
  | { status: 'success'; data: User[] }
  | { status: 'error'; error: Error };
\`\`\`

### Template Literal Types
\`\`\`ts
type EventName = \`on\${Capitalize<string>}\`;
\`\`\`

### Mapped Types
\`\`\`ts
type Nullable<T> = { [K in keyof T]: T[K] | null };
\`\`\``,
    problems: [
      { lc: 238, n: "Product Except Self", diff: "Medium" },
      { lc: 347, n: "Top K Frequent", diff: "Medium" },
      { lc: 128, n: "Longest Consecutive Seq", diff: "Medium" },
    ],
    eveningSpec: "Type-safe Form Library using TS generics. Infer form value types from schema.",
    resources: [
      { label: "TypeScript Handbook", url: "https://www.typescriptlang.org/docs/handbook/intro.html" },
      { label: "Type Challenges", url: "https://github.com/type-challenges/type-challenges" },
    ],
    successCriteria: ["Form lib with zero \`any\` types"],
  },
  23: {
    fullTheory: `## Next.js App Router & RSC

### App Router Structure
\`\`\`
app/
  layout.tsx      — shared UI
  page.tsx        — route
  loading.tsx     — Suspense fallback
  error.tsx       — error boundary
  not-found.tsx
\`\`\`

### Server Components (default)
Zero JS. Async. Fetch directly from DB.
\`\`\`jsx
export default async function Page() {
  const data = await db.query(...);
  return <List data={data} />;
}
\`\`\`

### Client Components
Mark with \`'use client'\` directive. Has state, effects, events.

### Streaming SSR
Suspense boundaries = streaming boundaries. Progressive HTML.

### ISR
Next 13: \`revalidate\` option on fetch or route.`,
    problems: [
      { lc: 152, n: "Max Product Subarray", diff: "Medium" },
      { lc: 198, n: "House Robber", diff: "Medium" },
      { lc: 139, n: "Word Break", diff: "Medium" },
    ],
    eveningSpec: "System Design: Analytics Dashboard with real-time updates.",
    resources: [
      { label: "Next.js docs", url: "https://nextjs.org/docs" },
    ],
    successCriteria: ["Understand when to use 'use client'"],
  },
  24: {
    fullTheory: `## State Machines & Design Patterns

### XState
Explicit state machines for UI logic.
\`\`\`js
const machine = createMachine({
  initial: 'idle',
  states: {
    idle: { on: { FETCH: 'loading' } },
    loading: { on: { DONE: 'success', ERROR: 'failure' } },
    success: {},
    failure: { on: { RETRY: 'loading' } },
  },
});
\`\`\`

### Design Patterns
- **Observer** — pub/sub
- **Strategy** — interchangeable algorithms
- **Factory** — object creation
- **Singleton** — one instance
- **Decorator** — wrap with new behavior`,
    problems: [
      { lc: 62, n: "Unique Paths", diff: "Medium" },
      { lc: 1143, n: "LCS", diff: "Medium" },
      { lc: 72, n: "Edit Distance", diff: "Hard" },
    ],
    eveningSpec: "File Explorer with tree, drag-drop, context menu, rename, create, delete.",
    resources: [
      { label: "XState docs", url: "https://stately.ai/docs/" },
      { label: "Refactoring.guru: Patterns", url: "https://refactoring.guru/design-patterns" },
    ],
    successCriteria: ["File explorer works on 1000+ nodes"],
  },
  25: {
    fullTheory: `## Accessibility & i18n

### WCAG 2.1 AA Checklist
- Keyboard: all interactive reachable + operable
- Focus: visible ring, logical order
- Contrast: 4.5:1 for text
- ARIA: roles, states, properties
- Screen reader tested

### Focus Management
- Skip links
- Modal: trap focus, restore on close
- After nav: focus main heading

### ARIA Live Regions
\`aria-live="polite"\` / \`"assertive"\` for dynamic updates.

### i18n
- Intl API for numbers, dates
- ICU MessageFormat for pluralization
- RTL support via logical properties`,
    problems: [
      { lc: 131, n: "Palindrome Partitioning", diff: "Medium" },
      { lc: 22, n: "Generate Parentheses", diff: "Medium" },
    ],
    eveningSpec: "Build Modal + Dropdown + DatePicker from scratch, all WCAG AA compliant.",
    resources: [
      { label: "WCAG 2.1 Quick Reference", url: "https://www.w3.org/WAI/WCAG21/quickref/" },
      { label: "MDN: ARIA", url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA" },
    ],
    successCriteria: ["Audit with axe: 0 violations"],
  },
  26: {
    fullTheory: `## Mock Interview Day 1 — Behavioral

Prep 8-10 STAR stories covering:
1. Leadership (drove project, made decisions)
2. Conflict resolution
3. Failure / learning
4. Ambiguous requirements
5. Cross-team collaboration
6. Mentored someone
7. Technical challenge
8. Customer impact
9. Why this company?
10. Where in 5 years?

Write each in STAR format (Situation-Task-Action-Result) with quantified outcome.`,
    problems: [
      { lc: 76, n: "Min Window Substring", diff: "Hard" },
      { lc: 4, n: "Median of Two Sorted Arrays", diff: "Hard" },
    ],
    eveningSpec: "Full machine coding mock: Spreadsheet with formulas. 90 min. No Googling.",
    resources: [],
    successCriteria: ["10 STAR stories written + practiced out loud"],
  },
  27: {
    fullTheory: "System design prep. Review 5 classic designs: Chat, Feed, URL shortener, Rate limiter, Search. Whiteboard each from memory.",
    problems: [
      { lc: 41, n: "First Missing Positive", diff: "Hard" },
      { lc: 329, n: "Longest Increasing Path", diff: "Hard" },
    ],
    eveningSpec: "Full system design mock: Flipkart/Amazon product page end-to-end.",
    resources: [
      { label: "Alex Xu: System Design Interview", url: "https://www.amazon.com/System-Design-Interview-insiders-Second/dp/B08CMF2CQF" },
      { label: "Gaurav Sen YouTube", url: "https://www.youtube.com/c/GauravSen" },
    ],
    successCriteria: ["Design explained without notes"],
  },
  28: {
    fullTheory: `## Cultural Fit & Interview Close

Prep answers:
- Tell me about yourself (2 min pitch)
- Why this company? (specific — their engineering blog, products)
- Why leaving current role? (growth, not negative)
- 5-year plan
- Questions for them (always have 3-5 prepared)

Questions to ask:
- Biggest engineering challenge the team is tackling?
- How are decisions made — bottom-up or top-down?
- How do you measure engineer success at this level?
- What does growth from L2 → L3 look like?`,
    problems: [
      { lc: 124, n: "BT Max Path Sum", diff: "Hard" },
      { lc: 297, n: "Serialize BT", diff: "Hard" },
    ],
    eveningSpec: "Full machine coding mock: Calendar with drag-to-create, recurring events.",
    resources: [
      { label: "Levels.fyi", url: "https://www.levels.fyi/" },
      { label: "Glassdoor interviews", url: "https://www.glassdoor.com/" },
    ],
    successCriteria: ["Have 5 well-researched questions per target company"],
  },
  29: {
    fullTheory: "Identify your weakest 3 topics from previous days. Re-read your notes. Watch a deep-dive video for each. Redo problems you failed or struggled with.",
    problems: [],
    eveningSpec: "Redo the weakest machine coding round with timer. Record self-review.",
    resources: [],
    successCriteria: ["Weakness now confident"],
  },
  30: {
    fullTheory: `## Final Prep

- Light review only — don't cram new things
- Test setup: webcam, mic, browser, IDE
- Charge laptop, ensure internet
- Prepare water, snacks
- Sleep 8 hours

Tomorrow morning:
- Warm up with 1 easy problem
- Review STAR stories quickly
- Dress appropriately, even for remote
- Breathe. You prepared.`,
    problems: [
      { lc: 1, n: "Two Sum", diff: "Easy" },
      { lc: 53, n: "Max Subarray", diff: "Medium" },
    ],
    eveningSpec: "Rest. Prep clothes/setup. Sleep by 10pm.",
    resources: [],
    successCriteria: ["Ready to interview"],
  },
};

// ─── BE Plan — full 30 days ───────────────────────────────
export const BE_PLAN_DETAIL = {
  1: {
    fullTheory: `## Arrays & Hashing Mastery

### Two Pointers
- **Opposite ends**: 3Sum, Container With Most Water
- **Slow/Fast**: Remove Duplicates, Detect Cycle
- **Same direction**: Sliding window

### Sliding Window
- Expand right, shrink left
- Maintain invariant inside window
- Patterns: "longest substring with property", "minimum window containing..."

### Prefix Sum
\`\`\`
For range sum [i, j]: prefix[j+1] - prefix[i]
Subarray sum = k: count of (curr_sum - k) seen before
\`\`\`

### Kadane's (max subarray)
\`\`\`
curr = max(nums[i], curr + nums[i])
best = max(best, curr)
\`\`\`

### Dutch Flag (3-way partition)
Sort Colors — i, j, k pointers.

### Hash Map Patterns
- Complement (Two Sum)
- Frequency count (Anagrams, Top K)
- Running state + hash (Subarray Sum K)`,
    problems: [
      { lc: 1, n: "Two Sum", diff: "Easy" },
      { lc: 15, n: "3Sum", diff: "Medium" },
      { lc: 3, n: "Longest Substring Without Repeat", diff: "Medium" },
      { lc: 560, n: "Subarray Sum = K", diff: "Medium" },
      { lc: 238, n: "Product Except Self", diff: "Medium" },
    ],
    eveningSpec: "Solve 5 problems under 25 min each. Write approach first, then code.",
    resources: [{ label: "NeetCode Arrays & Hashing", url: "https://neetcode.io/roadmap" }],
    successCriteria: ["5 problems solved in time", "Can recognize pattern within 2 min"],
  },
  2: {
    fullTheory: `## Strings & Pattern Matching

### KMP (Knuth-Morris-Pratt)
Preprocess pattern to avoid re-comparing matched prefixes.
\`\`\`
Build LPS (longest proper prefix = suffix) array.
When mismatch, shift pattern using LPS instead of restarting.
Complexity: O(n + m) vs naive O(n*m)
\`\`\`

### Rabin-Karp (rolling hash)
\`\`\`
hash(s[i..i+m]) computed from hash(s[i-1..i-1+m]) in O(1)
Used: substring search, plagiarism detection
\`\`\`

### Z-algorithm
Z[i] = length of longest substring starting at i that matches prefix.
Used: fastest pattern matching for strings.

### Trie
Prefix tree. Insert/search/startsWith all O(word length).
Used: autocomplete, spell check, word search, IP routing.

### Expand Around Center (palindromes)
For each index (and each gap), try to expand outward.

### Anagram Grouping
Sorted string as key. Or character count tuple as key.`,
    problems: [
      { lc: 5, n: "Longest Palindromic Substring", diff: "Medium" },
      { lc: 49, n: "Group Anagrams", diff: "Medium" },
      { lc: 76, n: "Min Window Substring", diff: "Hard" },
      { lc: 647, n: "Palindromic Substrings", diff: "Medium" },
      { lc: 28, n: "Find Index of First Occurrence (KMP)", diff: "Easy" },
    ],
    eveningSpec: `Implement KMP from scratch. Test against naive O(nm). Verify correctness + measure speed difference on long strings.`,
    resources: [
      { label: "CP Algorithms: KMP", url: "https://cp-algorithms.com/string/prefix-function.html" },
      { label: "Z-algorithm explained", url: "https://cp-algorithms.com/string/z-function.html" },
    ],
    successCriteria: ["KMP implementation passes edge cases", "5 problems timed"],
  },
  3: {
    fullTheory: `## Linked Lists & Stacks

### Floyd's Cycle Detection (Tortoise & Hare)
\`\`\`
slow = fast = head
while fast && fast.next:
  slow = slow.next
  fast = fast.next.next
  if slow == fast: cycle
\`\`\`
To find cycle start: reset slow to head, advance both by 1 until they meet.

### Reversal
\`\`\`
prev = null, curr = head
while curr:
  next = curr.next
  curr.next = prev
  prev = curr
  curr = next
return prev
\`\`\`
Variants: reverse in groups of K, reverse between positions m and n.

### Monotonic Stack
Stack where elements are always in increasing or decreasing order.
Pop when new element breaks the invariant.
Used: Next Greater Element, Largest Rectangle in Histogram, Daily Temperatures.

### LRU Cache (classic design question)
HashMap + Doubly Linked List:
- HashMap: key → node (for O(1) access)
- DLL: order by recency (head = most recent, tail = least)
- On access: move to head. On put with capacity exceeded: remove tail.`,
    problems: [
      { lc: 206, n: "Reverse Linked List", diff: "Easy" },
      { lc: 23, n: "Merge K Sorted Lists", diff: "Hard" },
      { lc: 146, n: "LRU Cache", diff: "Medium" },
      { lc: 739, n: "Daily Temperatures", diff: "Medium" },
      { lc: 20, n: "Valid Parens", diff: "Easy" },
    ],
    eveningSpec: "Implement LRU Cache from scratch in your language. All operations O(1). Handle edge cases (capacity 0, single item).",
    resources: [{ label: "LRU Cache detailed walkthrough", url: "https://leetcode.com/problems/lru-cache/solutions/" }],
    successCriteria: ["LRU Cache O(1) get + put verified", "Understand why array-based LRU is O(n)"],
  },
  4: {
    fullTheory: `## Trees (Binary & BST)

### Traversals
- **DFS**: preorder (root-left-right), inorder (left-root-right), postorder (left-right-root)
- **BFS**: level by level (queue-based)
- **Morris**: O(1) space inorder (threaded binary tree)

### BST Properties
- Inorder traversal gives sorted sequence
- Search/Insert/Delete O(h) where h = height
- Balanced: h = log n. Unbalanced: h = n (degenerate)

### LCA (Lowest Common Ancestor)
- BST: split based on values (both < root → left; both > root → right; else = LCA)
- Binary Tree: recurse; if both subtrees find p or q, current node is LCA

### Serialize/Deserialize
- Preorder with null markers: "1,2,null,null,3,null,null"
- Used in: distributed caches, network transmission

### Diameter
\`\`\`
dfs(node):
  left = dfs(node.left)
  right = dfs(node.right)
  global_max = max(global_max, left + right)
  return 1 + max(left, right)
\`\`\`

### Max Path Sum
Similar to diameter, but sums values. Reject negative paths.`,
    problems: [
      { lc: 102, n: "Level Order Traversal", diff: "Medium" },
      { lc: 235, n: "LCA of BST", diff: "Medium" },
      { lc: 297, n: "Serialize Deserialize BT", diff: "Hard" },
      { lc: 98, n: "Validate BST", diff: "Medium" },
      { lc: 124, n: "BT Max Path Sum", diff: "Hard" },
    ],
    eveningSpec: "Implement Serialize + Deserialize. Both round-trip correctly for all edge cases (null root, skewed tree, full tree).",
    resources: [{ label: "Tree traversals", url: "https://en.wikipedia.org/wiki/Tree_traversal" }],
    successCriteria: ["All 5 problems solved", "Can reconstruct any tree from preorder+inorder"],
  },
  5: {
    fullTheory: `## Heaps & Priority Queues

### Min-heap / Max-heap
Complete binary tree. Parent ≤ children (min) or ≥ (max).
Array representation: parent(i) = (i-1)/2, left(i) = 2i+1, right(i) = 2i+2.

### Operations
- peek: O(1)
- push: O(log n) — sift up
- pop: O(log n) — sift down after moving last to root
- heapify (build from array): O(n) — sift down from bottom-up

### Top-K Pattern
Maintain heap of size K.
- Top K largest → min-heap (evict smallest)
- Top K smallest → max-heap (evict largest)

### Two Heaps (Median from Stream)
- Max-heap (lower half) + min-heap (upper half)
- Balance: sizes differ by ≤ 1
- Median: top of larger, or avg of tops if equal size

### Merge K Sorted
Min-heap of heads. Pop → add to result → push popped node's next.

### Quickselect (alternative to heap for Top-K)
Partition-based, O(n) avg, O(n²) worst. In-place.`,
    problems: [
      { lc: 215, n: "Kth Largest Element", diff: "Medium" },
      { lc: 295, n: "Median from Data Stream", diff: "Hard" },
      { lc: 23, n: "Merge K Sorted Lists", diff: "Hard" },
      { lc: 347, n: "Top K Frequent", diff: "Medium" },
      { lc: 973, n: "K Closest Points to Origin", diff: "Medium" },
    ],
    eveningSpec: "Implement Min-Heap class from scratch with push/pop/peek/heapify. Write unit tests. Compare with built-in priority queue.",
    resources: [{ label: "Heap explained", url: "https://en.wikipedia.org/wiki/Binary_heap" }],
    successCriteria: ["Custom heap passes tests", "Understand O(n) heapify proof"],
  },
  6: {
    fullTheory: `## Graphs — Basics

### Representations
- **Adjacency list**: \`Map<Node, List<Node>>\` — space O(V+E), good for sparse
- **Adjacency matrix**: 2D array — O(V²) space, O(1) edge check

### BFS
Queue. Level by level. Shortest path in unweighted graph.

### DFS
Stack or recursion. Explore deep before wide. Detect cycles, topological sort.

### Topological Sort
For DAGs only. Linear ordering where u → v implies u before v.
- **Kahn's (BFS)**: repeatedly pull zero-indegree node
- **DFS-based**: post-order reverse

### Cycle Detection
- Undirected: DFS + parent check
- Directed: 3-color DFS (white/gray/black) — back edge to gray = cycle

### Union-Find (Disjoint Set Union)
- **find(x)**: walk parents to root. Path compression = O(α(n)) amortized
- **union(x, y)**: link roots. Union by rank/size balances tree
- Used: connected components, cycle detection in undirected graph, Kruskal's MST

### Connected Components
DFS or BFS from each unvisited node → count.`,
    problems: [
      { lc: 200, n: "Number of Islands", diff: "Medium" },
      { lc: 207, n: "Course Schedule", diff: "Medium" },
      { lc: 133, n: "Clone Graph", diff: "Medium" },
      { lc: 417, n: "Pacific Atlantic Water Flow", diff: "Medium" },
      { lc: 323, n: "Number of Connected Components", diff: "Medium" },
      { lc: 261, n: "Graph Valid Tree", diff: "Medium" },
    ],
    eveningSpec: "Implement Union-Find with path compression + union by rank. Use it to detect cycle in undirected graph.",
    resources: [
      { label: "CP Algorithms: DSU", url: "https://cp-algorithms.com/data_structures/disjoint_set_union.html" },
    ],
    successCriteria: ["Union-Find optimized to near-O(1)", "6 problems solved"],
  },
  7: {
    fullTheory: `## Graphs — Advanced

### Dijkstra (shortest path, non-negative weights)
\`\`\`
dist[source] = 0, rest = ∞
min-heap of (dist, node)
while heap not empty:
  d, u = heappop
  if d > dist[u]: skip (stale)
  for each edge (u, v, w):
    if dist[u] + w < dist[v]:
      dist[v] = dist[u] + w
      heappush(dist[v], v)
\`\`\`
O((V+E) log V) with binary heap.

### Bellman-Ford (handles negative weights)
Relax every edge V-1 times. Detect negative cycle on Vth pass.
O(VE).

### Floyd-Warshall (all pairs shortest path)
\`\`\`
for k: for i: for j:
  d[i][j] = min(d[i][j], d[i][k] + d[k][j])
\`\`\`
O(V³).

### MST — Prim's
Grow tree from a seed, always adding min-weight edge to tree.
Min-heap of (edge-weight, node). O((V+E) log V).

### MST — Kruskal's
Sort edges by weight. Union-Find to avoid cycles. Take V-1 smallest.
O(E log E).

### SCC — Tarjan's / Kosaraju's
Strongly connected components in directed graph.
Tarjan: one DFS with low-link values.
Kosaraju: two DFS passes (original + transpose).

### A* (heuristic shortest path)
Like Dijkstra but with heuristic. If heuristic is admissible (never overestimates), optimal.`,
    problems: [
      { lc: 743, n: "Network Delay Time", diff: "Medium" },
      { lc: 787, n: "Cheapest Flights K Stops", diff: "Medium" },
      { lc: 1584, n: "Min Cost to Connect All Points", diff: "Medium" },
      { lc: 332, n: "Reconstruct Itinerary", diff: "Hard" },
    ],
    eveningSpec: "Implement Dijkstra from scratch. Test on a graph with 100+ nodes. Compare with BFS when weights are uniform.",
    resources: [
      { label: "CLRS Chapter 24-25", url: "https://mitpress.mit.edu/books/introduction-algorithms-third-edition" },
    ],
    successCriteria: ["Dijkstra handles edge cases (unreachable, disconnected)", "Know when to use each algorithm"],
  },
  8: {
    fullTheory: `## Dynamic Programming I — 1D

### When to Suspect DP
- Optimization (max/min) or counting
- Overlapping subproblems
- Optimal substructure

### Approach
1. Define state (what does dp[i] mean?)
2. Base case (dp[0] or dp[n])
3. Transition (dp[i] from dp[i-1], dp[i-2], ...)
4. Direction (bottom-up iterative, top-down memoized)

### Fibonacci Pattern
\`\`\`
dp[i] = dp[i-1] + dp[i-2]  // Climbing Stairs, House Robber
\`\`\`

### Coin Change (unbounded knapsack)
\`\`\`
dp[amount] = min(dp[amount - coin] + 1) for each coin
\`\`\`

### 0/1 Knapsack
2D: dp[i][w] = max value using first i items within weight w.
\`\`\`
dp[i][w] = max(dp[i-1][w], dp[i-1][w - wi] + vi) if wi <= w
         = dp[i-1][w] otherwise
\`\`\`

### LIS (Longest Increasing Subsequence)
O(n²) DP or O(n log n) patience sorting (binary search).

### Partition / Subset Sum
Can we sum to k? → DP on (index, remaining sum).

### Space Optimization
Most 1D DP can use 2 variables instead of full array.`,
    problems: [
      { lc: 70, n: "Climbing Stairs", diff: "Easy" },
      { lc: 198, n: "House Robber", diff: "Medium" },
      { lc: 322, n: "Coin Change", diff: "Medium" },
      { lc: 300, n: "LIS", diff: "Medium" },
      { lc: 416, n: "Partition Equal Subset Sum", diff: "Medium" },
    ],
    eveningSpec: `Solve 5 classic 1D DP problems. For each: write recurrence, identify states, trace small example by hand before coding.`,
    resources: [
      { label: "Aditya Verma DP series", url: "https://www.youtube.com/playlist?list=PL_z_8CaSLPWekqhdCPmFohncHwz8TY2Go" },
    ],
    successCriteria: ["Write recurrence for each problem before coding", "5 problems solved"],
  },
  9: {
    fullTheory: `## Dynamic Programming II — 2D & Advanced

### Grid DP
Unique Paths, Min Path Sum — \`dp[i][j] = f(dp[i-1][j], dp[i][j-1])\`.

### Edit Distance
\`\`\`
if s1[i] == s2[j]: dp[i][j] = dp[i-1][j-1]
else: dp[i][j] = 1 + min(insert, delete, replace)
\`\`\`

### LCS (Longest Common Subsequence)
\`\`\`
if s1[i] == s2[j]: dp[i][j] = dp[i-1][j-1] + 1
else: dp[i][j] = max(dp[i-1][j], dp[i][j-1])
\`\`\`

### Word Break
\`\`\`
dp[i] = true if exists j where dp[j] is true AND s[j..i] in dict
\`\`\`

### Interval DP (Burst Balloons)
Think last action. \`dp[l][r]\` = optimal in subrange.
Order: length 2, 3, ... n.

### Bitmask DP (Traveling Salesman)
State = (bitmask of visited, current node). Only works for n ≤ 20.

### DP on Trees
Recurse children first, combine. E.g., House Robber III.

### DP + Other Data Structures
Monotonic deque + DP = O(n) for some problems.`,
    problems: [
      { lc: 62, n: "Unique Paths", diff: "Medium" },
      { lc: 72, n: "Edit Distance", diff: "Hard" },
      { lc: 1143, n: "LCS", diff: "Medium" },
      { lc: 312, n: "Burst Balloons", diff: "Hard" },
      { lc: 139, n: "Word Break", diff: "Medium" },
    ],
    eveningSpec: "Solve Edit Distance by hand on paper for small inputs. Then implement. Compare top-down vs bottom-up.",
    resources: [{ label: "Errichto DP", url: "https://www.youtube.com/c/Errichto" }],
    successCriteria: ["Can explain state + transition for each 2D problem"],
  },
  10: {
    fullTheory: `## Backtracking & Greedy

### Backtracking Template
\`\`\`
def backtrack(partial, choices):
  if is_solution(partial):
    result.append(partial.copy())
    return
  for choice in choices:
    if is_valid(partial, choice):
      partial.append(choice)
      backtrack(partial, narrowed_choices)
      partial.pop()  # undo
\`\`\`

### Pruning
- Sort input to skip duplicates
- Early termination on invalid states
- Memoization for overlapping subproblems

### Greedy Intervals
Sort by end time. Take earliest-ending non-conflicting.
Problems: Meeting Rooms, Non-overlapping Intervals, Minimum Arrows.

### Huffman Coding
Greedy: merge two smallest weights repeatedly. Optimal prefix code.

### Task Scheduler
Spread most-frequent tasks with gaps.
\`\`\`
max_freq = max(counts)
result = (max_freq - 1) * (n + 1) + count_with_max
\`\`\`

### Gas Station
Start from any station where cumulative gas never goes negative.`,
    problems: [
      { lc: 51, n: "N-Queens", diff: "Hard" },
      { lc: 39, n: "Combination Sum", diff: "Medium" },
      { lc: 79, n: "Word Search", diff: "Medium" },
      { lc: 56, n: "Merge Intervals", diff: "Medium" },
      { lc: 55, n: "Jump Game", diff: "Medium" },
      { lc: 621, n: "Task Scheduler", diff: "Medium" },
    ],
    eveningSpec: "Implement N-Queens. Use bitmask for O(1) column/diagonal checks.",
    resources: [],
    successCriteria: ["N-Queens solves n=12 in < 1 sec", "Recognize greedy vs DP trade-off"],
  },

  // ─── Phase 2: System Design ──────────────────────────────
  11: {
    fullTheory: `## System Design Fundamentals

### CAP Theorem
In partition, choose Consistency or Availability. P is mandatory (partitions happen).
- **CP**: RDBMS, MongoDB (w=majority), HBase. Block on partition.
- **AP**: Cassandra, DynamoDB, CouchDB. Accept writes on both sides, reconcile.

### ACID vs BASE
- **ACID** (RDBMS): Atomicity, Consistency, Isolation, Durability
- **BASE** (NoSQL): Basically Available, Soft-state, Eventually consistent

### Scaling
- **Vertical** — bigger box. Easy but has ceiling.
- **Horizontal** — more boxes. Needs shard key, consistent hashing.

### Load Balancer
- **L4** (TCP) — fast, no app knowledge. AWS NLB.
- **L7** (HTTP) — path/header routing. NGINX, Envoy, ALB.
- Algorithms: Round Robin, Least Connections, IP Hash, Weighted.

### CDN
Edge caches static + cacheable dynamic content. Cloudflare, Fastly, CloudFront.
Pop close to user → low latency.

### DNS
Domain → IP. TTL controls cache. Round-robin DNS for simple load balancing.

### Key Design Questions to Ask
1. Functional requirements
2. Non-functional (QPS, latency, storage, availability)
3. Scale estimates (back-of-envelope math)
4. Core objects + APIs
5. Data model
6. Architecture
7. Deep dive on 1-2 components
8. Bottlenecks + trade-offs`,
    problems: [],
    eveningSpec: "Draw architecture diagrams for: CAP, load balancing, CDN flow. Explain each aloud as if teaching.",
    resources: [
      { label: "DDIA — Martin Kleppmann", url: "https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321" },
      { label: "Gaurav Sen YT", url: "https://www.youtube.com/c/GauravSen" },
    ],
    successCriteria: ["Explain CAP with concrete examples", "Estimate QPS for 100M DAU app"],
  },
  12: {
    fullTheory: `## Database Design

### SQL vs NoSQL Decision Matrix
| | SQL | NoSQL |
|---|---|---|
| Schema | Strict | Flexible |
| Joins | First-class | Application-level |
| Transactions | ACID | Varies (usually eventual) |
| Scale | Vertical, some sharding | Horizontal-first |
| Use case | Core transactions | Large volume, specific patterns |

### Sharding
Partition by key across nodes. Strategies:
- **Range-based** — hotspots risk
- **Hash-based** — even distribution but resharding nightmare
- **Consistent hashing** — add/remove nodes with minimal rebalance

### Replication
- **Master-slave** — reads from slaves, writes to master
- **Master-master** — write to any, conflict resolution
- **Sync vs async** — durability vs latency trade-off

### Indexing
- **B-tree** — default, range queries, most use cases
- **LSM tree** — Cassandra, RocksDB. Write-optimized, batch flushes.
- **Hash** — O(1) equality only
- **Composite** — careful order (leftmost prefix rule)

### Connection Pooling
HikariCP, PgBouncer. Pool size heuristic: (cores × 2) + spindles.

### Query Optimization
- EXPLAIN ANALYZE
- Avoid N+1 (use JOINs or DataLoader)
- Covering indexes
- Denormalize for read-heavy hot paths`,
    problems: [],
    eveningSpec: `Design DB schema for e-commerce (users, products, orders, reviews). Decide sharding strategy for user data at 100M users.`,
    resources: [
      { label: "Use the Index Luke", url: "https://use-the-index-luke.com/" },
    ],
    successCriteria: ["Can explain B-tree vs LSM", "Shard e-commerce schema with clear rationale"],
  },
  13: {
    fullTheory: `## Caching & Messaging

### Caching Strategies
- **Cache-aside** — app reads/writes both. Most common.
- **Read-through** — cache fetches on miss (DAX).
- **Write-through** — sync write to cache + DB.
- **Write-behind** — async flush (Redis AOF patterns).
- **Refresh-ahead** — pre-refresh hot keys.

### Eviction
- **LRU** — default, recency-based
- **LFU** — frequency-based, better for long-tail
- **TTL** — time-based
- **Random** — surprisingly OK

### Cache Stampede
Hot key expires → concurrent DB hits.
- **Single-flight** — only one request populates
- **Probabilistic refresh** — refresh before expiry with small probability
- **Stale-while-revalidate** — return stale, refresh async

### Kafka
Distributed log — append-only, replicated, partitioned.
- Broker, Topic, Partition, Consumer Group
- Ordering within partition only
- Exactly-once via idempotent producer + transactions

### RabbitMQ
Queue-based. Push-to-consumer. Routing via exchanges.
Better for: task queues, RPC, complex routing.

### When to Use Kafka vs RabbitMQ
- Kafka: high throughput, event streaming, replay, many consumers
- RabbitMQ: task distribution, priority queues, complex routing`,
    problems: [],
    eveningSpec: "Design caching layer for Twitter feed (write fanout + hot user problem). Design event pipeline for order processing.",
    resources: [
      { label: "Kafka docs", url: "https://kafka.apache.org/documentation/" },
    ],
    successCriteria: ["Explain cache stampede + solutions", "Choose Kafka vs RabbitMQ with reasoning"],
  },
  14: {
    fullTheory: `## API Design & Microservices

### REST Principles
- Resources as nouns (/users, /orders)
- HTTP methods as verbs (GET/POST/PUT/DELETE)
- Status codes meaningful
- Stateless
- HATEOAS optional

### gRPC
HTTP/2 + Protocol Buffers. Binary, typed. Good for internal services.

### GraphQL
Client queries exact shape. Solves over/under-fetching. Beware N+1.

### API Gateway
Entry point for microservices. Handles: auth, rate limit, routing, logging, circuit breaking.
Kong, Envoy, NGINX, AWS API Gateway.

### Service Discovery
How do services find each other?
- Client-side (Eureka)
- Server-side (Consul)
- DNS-based (K8s services)

### Saga Pattern
Long-running distributed transactions via compensating actions.
- Choreography — services publish events
- Orchestration — central coordinator

### CQRS
Split read + write models. Writes → event log. Reads → projections optimized per query.

### Idempotency
Every mutation accepts \`Idempotency-Key\`. Retry-safe.

### Rate Limiting
- Token bucket (Stripe, AWS)
- Sliding window (accurate but memory-heavy)
- Fixed window counter (simple)`,
    problems: [],
    eveningSpec: "Design rate limiter service. Design API gateway for 10 microservices. Design payment service with idempotency + saga.",
    resources: [{ label: "API design patterns", url: "https://cloud.google.com/apis/design" }],
    successCriteria: ["Rate limiter design with Redis Lua script", "Saga pattern explained with refund example"],
  },
  15: {
    fullTheory: `## URL Shortener + Pastebin

### Requirements (TinyURL)
- Shorten long URL → short alias
- Redirect on access
- Analytics (optional)
- Custom aliases (optional)
- Expiration (optional)

### Estimates
- 100M URLs/month = 1.2B/year = 6B/5yr
- Storage: 500B/URL × 6B = 3TB metadata, 60TB with analytics
- Read:Write = 100:1 (redirect is read)

### Key Generation Approaches
1. **Auto-increment + Base62** — simple, sequential, enumerable
2. **Hash (MD5/SHA) + truncate** — collisions need retry
3. **Pre-generated pool** — separate service, O(1) allocation

Base62 over 7 chars = 62^7 = 3.5T possibilities.

### Architecture
- App servers (stateless)
- Key gen service (if pool-based)
- DB: NoSQL (KV store) — DynamoDB, Cassandra
- Cache: Redis for hot URLs
- CDN: serve 301 redirects from edge
- Analytics: Kafka → ClickHouse

### DB Schema
\`\`\`
urls {
  short_code (PK)
  long_url
  user_id
  created_at
  expires_at
  click_count  // denormalized
}
\`\`\`

### Scaling
- Shard by short_code hash
- 80/20 rule — 20% of URLs get 80% of traffic → cache them
- Multi-region with geo-DNS`,
    problems: [],
    eveningSpec: "Design TinyURL with analytics + custom alias. Write API spec, data model, scale math, estimated costs.",
    resources: [{ label: "TinyURL design", url: "https://github.com/donnemartin/system-design-primer" }],
    successCriteria: ["60TB calculation reasoned", "Base62 vs hash trade-off explained"],
  },
  16: {
    fullTheory: `## Chat + Notification System

### WhatsApp-like Chat
**Requirements:**
- 1:1 and group messaging
- Delivery receipts, read receipts
- Online presence
- Media (images, video, docs)
- E2E encryption

**Architecture:**
- Clients connect via WebSocket to Chat Server
- Chat Server → Kafka → storage + fanout
- Cassandra/HBase for messages (high write)
- Redis for presence (short TTL)
- S3 + CDN for media
- Push (FCM/APNs) for offline

**Message Flow:**
1. User A sends msg via WS
2. Server persists to Cassandra (partition by chatId)
3. Publishes event to Kafka
4. If User B online on another server → deliver via WS
5. If offline → FCM/APNs

**Key Decisions:**
- Fanout at read vs write (for groups)
- Message ordering: Lamport timestamps per chat
- E2E: Signal protocol (double ratchet)

### Notification Service
**Channels:** push, email, SMS, in-app.
**Components:**
- API (template + payload)
- Priority queue (critical vs promo)
- Channel workers (push, email, SMS)
- Template engine
- Delivery tracker
- Rate limiter (per user, per channel)

**Scale:**
- 1B/day = ~11K/sec avg, ~100K/sec peak
- Idempotency keys prevent duplicate sends
- FCM rate limits → shard across projects`,
    problems: [],
    eveningSpec: "Full design docs: Chat (100M users), Notification (multi-channel, 1B/day).",
    resources: [],
    successCriteria: ["Chat design handles offline users + groups", "Notification design has priority + rate limits"],
  },
  17: {
    fullTheory: `## Feed + Search System

### Twitter/Instagram Feed
**Fanout Strategy (big decision):**
- **Fanout on write** — precompute each follower's timeline. Fast reads, expensive writes. Fails for celebrities (100M followers).
- **Fanout on read** — compute timeline on demand. Slow reads, cheap writes. Fails for active users.
- **Hybrid** — fanout-write for normal users; fanout-read for celebrity posts (merged in).

**Components:**
- Tweet Service
- Fanout Service (consumer of tweet events)
- Timeline Cache (Redis sorted sets per user)
- Celebrity posts in separate stream, merged at read time
- Search via Elasticsearch (async-indexed)

**Estimates:**
- 500M users, 200M DAU
- 100 tweets per user avg → 20B tweets/day
- Timeline read: 200M × few/day = billions of reads

### Search / Typeahead
**Inverted index**: term → [document IDs]
**Ranking**: BM25 (tf-idf variant) + freshness + user signals

**Autocomplete:**
- Trie of popular queries
- Frequency-weighted
- Personalized via user history
- Aho-Corasick for multi-pattern matching

**Sharding:**
- Search: shard by term hash or by document (scatter-gather)
- Autocomplete: trie partitioned by prefix`,
    problems: [],
    eveningSpec: "Design Twitter feed. Design autocomplete for e-commerce search.",
    resources: [],
    successCriteria: ["Hybrid fanout reasoning clear", "Trie-based autocomplete implemented"],
  },
  18: {
    fullTheory: `## Payment + Booking

### Razorpay/Stripe Payment Gateway
**Invariant:** NEVER double-charge. Always reconcile.

**Architecture:**
- API Gateway (idempotency check)
- Payment Orchestrator (Saga coordinator)
- Provider adapters (card, UPI, wallet) with circuit breakers
- Ledger Service (double-entry bookkeeping)
- Reconciliation (daily match with bank)
- Fraud detection (ML + rules)

**Double-Entry Ledger:**
Every transaction = equal debit + credit. Balances always sum to zero.
\`\`\`
user "pays" merchant $100
  debit user_account $100
  credit merchant_account $100
\`\`\`

**Saga for Refund:**
1. Payment.refund
2. Update ledger
3. Notify provider
4. Notify merchant
5. Notify user
Any failure → compensation chain.

### BookMyShow Ticket Booking
**Core:** Seat must be held atomically while user pays.

**Approaches:**
- **Redis distributed lock** with 5-min TTL
- **Optimistic locking** — UPDATE WHERE status='available'
- **Pessimistic locking** — SELECT FOR UPDATE

**Flow:**
1. Pick seat → Redis SET NX EX 300 (5 min hold)
2. Pay
3. On success → write to DB, release hold
4. On timeout → auto-release

**Burst handling:**
- Virtual queue (waiting room) for hot events
- WebSocket for real-time seat updates
- Read-only fallback if DB overwhelmed`,
    problems: [],
    eveningSpec: "Design Razorpay payment gateway. Design BookMyShow for movie release concurrency.",
    resources: [],
    successCriteria: ["Idempotency + saga + ledger all explained", "Concurrent seat booking solved"],
  },

  // ─── Phase 3: Machine Coding ──────────────────────────
  19: {
    fullTheory: `## OOP & Design Patterns

### SOLID
- **S**: Single Responsibility
- **O**: Open/Closed
- **L**: Liskov Substitution
- **I**: Interface Segregation
- **D**: Dependency Inversion

### Core Patterns
**Creational:**
- Factory — object creation without new
- Builder — step-by-step construction
- Singleton — one instance
- Prototype — clone existing

**Structural:**
- Adapter — translate interfaces
- Decorator — wrap with behavior
- Facade — simplify complex subsystem
- Proxy — surrogate access

**Behavioral:**
- Strategy — interchangeable algorithms
- Observer — pub/sub
- Command — encapsulate request as object
- State — behavior per state
- Template Method — skeleton with hook methods
- Chain of Responsibility — handler chain

### When to Use Which
- Pluggable algorithms → Strategy
- Event-driven → Observer
- Object creation flexibility → Factory
- State machines → State pattern
- Async workflows → Command`,
    problems: [],
    eveningSpec: "Implement pluggable notification system using Strategy + Factory. Add 3 channels (email, SMS, push) without modifying existing code.",
    resources: [
      { label: "Refactoring Guru", url: "https://refactoring.guru/design-patterns" },
    ],
    successCriteria: ["Notification system works + extensible", "Can name + explain each pattern"],
  },
  20: {
    fullTheory: `## Parking Lot

### Requirements
- Multi-floor, multi-spot-type
- Vehicle types: Bike, Car, Truck
- Entry/Exit with ticket
- Pricing by duration + type
- Nearest-spot allocation
- Availability query

### Class Design
\`\`\`
ParkingLot (Singleton)
├── floors: List<Floor>
├── pricingStrategy: PricingStrategy
├── park(vehicle) → Ticket
├── exit(ticketId) → Receipt

Floor
├── spots: List<Spot>
├── getAvailable(type) → Spot

Spot
├── id, type, isOccupied, currentVehicle

Vehicle (abstract) → Bike, Car, Truck
  ├── licensePlate, type, requiredSpotType

Ticket
├── id, spotId, entryTime, vehicleId

PricingStrategy (interface)
├── HourlyPricing, DayPricing, FlatPricing
\`\`\`

### Patterns Used
- **Singleton**: ParkingLot
- **Factory**: Vehicle creation
- **Strategy**: Pricing swappable
- **Observer**: Notify display boards on spot state change`,
    problems: [],
    eveningSpec: "Full implementation. Include: park(), exit(), fee calculation, availability. Tests for edge cases (full lot, invalid ticket).",
    resources: [],
    successCriteria: ["Tests pass for all operations", "Adding new vehicle type requires no mods to ParkingLot"],
  },
  21: {
    fullTheory: `## Splitwise

### Requirements
- Users, Groups, Expenses
- Split types: Equal, Exact, Percentage, Shares
- Track who owes whom
- Debt simplification (minimize transactions)
- Activity feed

### Class Design
\`\`\`
User (id, name, email)
Group (id, name, members, expenses)
Expense (id, amount, paidBy, splits, timestamp)
Split (userId, amount)
SplitStrategy (interface)
  → EqualSplit, ExactSplit, PercentageSplit, ShareSplit
BalanceManager
  └── balances: Map<UserId, Map<UserId, amount>>
DebtSimplifier
  └── simplify() → graph algorithm
\`\`\`

### Debt Simplification (the interesting part)
Graph: users = nodes, debts = edges.
Algorithm: for each user, compute net balance (credits - debits).
Pair positive with negative balances → fewer transactions.

Example: A owes B $10, B owes C $5 → A owes B $5, A owes C $5 (same 2 txns).
But A owes B $10, B owes A $5 → net: A owes B $5 (1 txn instead of 2).`,
    problems: [],
    eveningSpec: "Build expense tracker. Implement all 4 split strategies. Implement debt simplification with tests showing reduced transaction count.",
    resources: [],
    successCriteria: ["All splits mathematically correct", "Debt simplification reduces txns in test cases"],
  },
  22: {
    fullTheory: `## In-Memory DB / Cache (Redis-like)

### Requirements
- GET, SET, DEL
- TTL / EXPIRE
- LRU / LFU eviction
- Pub/Sub
- Persistence (RDB snapshots + AOF)
- Thread-safe

### LRU Implementation
HashMap + Doubly Linked List.
- HashMap: key → DLL node (O(1) lookup)
- DLL: order by recency (head = most recent)
- get(k): move node to head
- put(k, v): add at head; if over capacity, remove tail

### TTL
Two approaches:
- **Lazy expiry**: check TTL on access, delete if expired
- **Active expiry**: background thread scans random keys

Redis does both.

### Pub/Sub
Simple: Map<channel, Set<subscriber>>. On publish, iterate subs.

### Persistence
- **RDB**: snapshot every N seconds (Brick compaction pattern)
- **AOF**: append every write to log file (replay on restart)

### Thread Safety
Redis is single-threaded (avoids locks). For our implementation: use synchronized or ReentrantLock. Better: fine-grained locks per key bucket.`,
    problems: [],
    eveningSpec: "Build key-value store with GET/SET/DEL/EXPIRE + LRU + pub/sub. Thread-safe. Benchmark against HashMap.",
    resources: [],
    successCriteria: ["1M ops/sec on single thread", "All operations O(1)"],
  },
  23: {
    fullTheory: `## Task/Job Scheduler

### Requirements
- Submit jobs
- Priority queue
- Cron scheduling
- Retry with exponential backoff
- Dead letter queue (DLQ)
- Concurrency control

### Class Design
\`\`\`
JobScheduler
├── priorityQueue: PriorityQueue<Job>
├── workers: ThreadPool
├── submit(Job): JobId
├── cancel(jobId)

Job (abstract)
├── id, priority, retriesLeft, maxRetries, backoffMs
├── execute()
├── onSuccess(), onFailure()

CronJob extends Job
├── cronExpression
├── nextFireTime()

RetryPolicy (Strategy)
├── ExponentialBackoff, FixedDelay, Custom

DeadLetterQueue
└── Persists failed jobs for manual inspection
\`\`\`

### Concurrency
- Main thread pulls from PQ → submits to worker pool
- Worker pool executes
- On failure → reschedule with backoff OR move to DLQ

### Cron Parsing
Use library (quartz, cron-parser). Don't build from scratch unless you enjoy regex.`,
    problems: [],
    eveningSpec: "Full scheduler with priority, retries, DLQ. Test: submit 1000 jobs with mix of priorities, some failing. Verify all either succeed or end up in DLQ.",
    resources: [],
    successCriteria: ["Jobs execute in priority order", "Retries follow backoff"],
  },
  24: {
    fullTheory: `## Rate Limiter

### Algorithms

**Token Bucket**
- Bucket holds N tokens, refilled R tokens/sec
- Each request takes 1 token
- Allows bursts up to N
- Used: Stripe, AWS API

**Leaky Bucket**
- Fixed outflow rate
- Excess queued (or dropped)
- Smoothes traffic

**Fixed Window Counter**
- Count requests per time window (e.g., per minute)
- Simple but has burst-at-boundary problem (2x limit possible)

**Sliding Window Log**
- Store timestamp of every request
- Count timestamps within window
- Accurate but memory-heavy

**Sliding Window Counter**
- Weighted avg of current + previous window
- Good balance of accuracy + memory

### Distributed Rate Limiting
Challenge: multiple servers, shared limit.
- Redis with Lua script (atomic INCR + EXPIRE)
- Or: local approximate + periodic sync`,
    problems: [],
    eveningSpec: "Implement all 4 algorithms. Configurable per user/endpoint. Tests verify correctness at boundary conditions.",
    resources: [],
    successCriteria: ["All 4 algorithms work", "Can choose right one per use case"],
  },
  25: {
    fullTheory: `## Elevator / Snake & Ladder

### Elevator System
**Requirements:**
- N elevators, M floors
- Internal button (from inside)
- External up/down button (from floor)
- Efficient scheduling

**Scheduling Algorithms:**
- **FCFS** — first come first served. Inefficient.
- **SCAN** — one direction until no more, reverse. Like an elevator in real life.
- **LOOK** — SCAN but reverse as soon as no more in direction.

**Class Design:**
\`\`\`
ElevatorSystem
├── elevators: List<Elevator>
├── assign(request) → Elevator (choose best)

Elevator
├── currentFloor, direction, requests: TreeSet<Integer>
├── addRequest(floor)
├── tick() — move one floor
\`\`\`

### Snake & Ladder
**Requirements:**
- NxN board with snakes (go down) and ladders (go up)
- Multiple players
- Configurable dice
- Win detection
- Turn management

**Class Design:**
\`\`\`
Game
├── board: Board
├── players: Queue<Player>
├── dice: Dice
├── play() until winner

Board
├── size
├── snakes: Map<Integer, Integer>  // head → tail
├── ladders: Map<Integer, Integer>  // bottom → top
├── nextPosition(from, roll) → int

Player
├── id, position
\`\`\``,
    problems: [],
    eveningSpec: "Implement one (Elevator OR Snake & Ladder). Full test coverage.",
    resources: [],
    successCriteria: ["Elevator picks best car for request", "S&L handles snake/ladder on winning square"],
  },

  // ─── Phase 4: Deep Dive & Mocks ──────────────────────
  26: {
    fullTheory: `## Concurrency & Multithreading

### Thread Pool Pattern
Bounded workers + queue. Prevents unbounded thread creation.

\`\`\`
ExecutorService pool = Executors.newFixedThreadPool(10);
pool.submit(() -> doWork());
pool.shutdown();
\`\`\`

### Locks
- **Mutex** — mutual exclusion (synchronized in Java)
- **ReadWriteLock** — multiple readers OR one writer
- **Semaphore** — limit concurrent access (e.g., connection pool)
- **CountDownLatch** — wait for N events
- **CyclicBarrier** — reusable barrier
- **Atomic classes** — lock-free via CAS

### Common Pitfalls
- **Deadlock** — inconsistent lock ordering. Fix: always acquire in same order.
- **Race condition** — TOCTOU (time-of-check vs time-of-use)
- **Starvation** — thread never gets resource
- **Livelock** — threads keep retrying without progress

### Producer-Consumer
BlockingQueue handles it.
- LinkedBlockingQueue (unbounded)
- ArrayBlockingQueue (bounded)

### Virtual Threads (Java 21+)
JVM-scheduled, millions feasible. Replaces traditional thread pools for I/O-bound work.

### Go Concurrency Model (CSP)
Channels for communication, goroutines for concurrency.
\`\`\`go
ch := make(chan int)
go func() { ch <- 42 }()
v := <-ch
\`\`\``,
    problems: [],
    eveningSpec: `Implement:
1. Thread-safe bounded queue (blocking on full/empty)
2. Producer-consumer with 3 producers + 2 consumers
3. Dining Philosophers (deadlock-free)`,
    resources: [{ label: "Java Concurrency in Practice", url: "https://jcip.net/" }],
    successCriteria: ["All 3 implementations deadlock-free"],
  },
  27: {
    fullTheory: `## Database & SQL Deep Dive

### Query Plans
\`\`\`sql
EXPLAIN ANALYZE SELECT ...
\`\`\`
Look for:
- Seq Scan on large tables (needs index)
- Nested Loop with high row count (try Hash Join)
- Expensive sorts (add index for ORDER BY)

### N+1 Problem
\`\`\`
users = SELECT * FROM users
for user in users:
  user.orders = SELECT * FROM orders WHERE user_id = ?
\`\`\`
Fix: JOIN or IN (batch query).

### Connection Pooling
Each connection costs memory. Pool size heuristic: (cores * 2) + effective_spindle_count.
HikariCP, PgBouncer.

### Isolation Levels
| Level | Dirty | Non-repeatable | Phantom |
|---|---|---|---|
| Read Uncommitted | ✓ | ✓ | ✓ |
| Read Committed | ✗ | ✓ | ✓ |
| Repeatable Read | ✗ | ✗ | ✓ |
| Serializable | ✗ | ✗ | ✗ |

### Deadlocks
DB detects, aborts one (the "victim"). Minimize by:
- Consistent lock ordering
- Short transactions
- Lower isolation level if possible

### Window Functions
\`\`\`sql
SELECT product, revenue,
  RANK() OVER (PARTITION BY category ORDER BY revenue DESC) AS rank
FROM sales;
\`\`\`
Powerful for ranking, running totals, moving averages.

### CTEs
\`\`\`sql
WITH active_users AS (SELECT ...)
SELECT ... FROM active_users;
\`\`\`
Recursive CTEs for hierarchies.`,
    problems: [
      { lc: 176, n: "Second Highest Salary", diff: "Medium" },
      { lc: 185, n: "Department Top Three Salaries", diff: "Hard" },
      { lc: 1164, n: "Product Price at Given Date", diff: "Medium" },
    ],
    eveningSpec: "Complex SQL: window functions + CTEs. Optimize 2 slow queries with EXPLAIN. Design composite indexes.",
    resources: [{ label: "PostgreSQL docs: Performance", url: "https://www.postgresql.org/docs/current/performance-tips.html" }],
    successCriteria: ["5 SQL problems solved", "Optimized query shows 10x+ improvement"],
  },
  28: {
    fullTheory: `## DevOps & Infrastructure

### Docker
- Dockerfile defines image
- Multi-stage builds reduce size
- \`.dockerignore\` avoids bloat
- Non-root user for security
- Pin versions (avoid \`:latest\`)

### Kubernetes Basics
- **Pod** — smallest deploy unit
- **Deployment** — manages replicas, rolling updates
- **Service** — stable endpoint (ClusterIP, NodePort, LoadBalancer)
- **Ingress** — L7 routing
- **ConfigMap/Secret** — config + sensitive data
- **HPA** — horizontal pod autoscaler

### CI/CD
Pipeline stages:
1. Lint / format
2. Unit tests (parallel)
3. Build (Docker image)
4. Security scan (Snyk, Trivy)
5. Deploy to staging
6. Integration / E2E tests
7. Manual approval (optional)
8. Deploy to prod (canary/blue-green)

### Monitoring
- **Metrics**: Prometheus + Grafana
- **Logs**: ELK or Loki
- **Traces**: Jaeger, Tempo, OpenTelemetry
- **Alerts**: Alertmanager, PagerDuty

### Health Checks
- **Liveness** — restart if failing
- **Readiness** — stop sending traffic if failing

### Deployment Strategies
- **Rolling** — K8s default. Replace pods one at a time.
- **Blue-Green** — two environments, switch traffic.
- **Canary** — route X% to new version, ramp up if healthy.`,
    problems: [],
    eveningSpec: "Dockerize a microservice. Write K8s deployment + service manifest. Add health checks + HPA.",
    resources: [
      { label: "K8s docs", url: "https://kubernetes.io/docs/home/" },
      { label: "Docker best practices", url: "https://docs.docker.com/develop/develop-images/dockerfile_best-practices/" },
    ],
    successCriteria: ["Service deployed + scales", "Can explain each K8s object"],
  },
  29: {
    fullTheory: `## Mock Interview Day

Simulate a real interview loop. Timing is strict.

### Structure
- 45 min DSA (1 medium + 1 hard OR 2 mediums)
- 5 min break
- 45 min System Design (1 full system — chat, feed, etc.)
- 5 min break
- 60 min Machine Coding (1 LLD — parking lot, splitwise, etc.)
- 5 min break
- 30 min Behavioral (4-5 STAR stories)

### Ground Rules
- No Googling
- No auto-complete / snippets
- Explain while coding
- Draw architecture before designing
- Handle edge cases

### Post-mock Review
For each round:
1. What went well?
2. Where did you freeze or slow down?
3. What would the interviewer have noted?
4. What to improve tomorrow?`,
    problems: [],
    eveningSpec: "Run the full mock. Record yourself. Watch back. Write a review doc.",
    resources: [
      { label: "Pramp — free mock interviews", url: "https://www.pramp.com/" },
      { label: "Interviewing.io", url: "https://interviewing.io/" },
    ],
    successCriteria: ["Completed full loop", "Review doc identifies 3+ concrete improvements"],
  },
  30: {
    fullTheory: `## Final Prep & Revision

### Revise
- Top 20 DSA patterns (make a 1-pager cheat sheet)
- 5 classic system designs (Chat, Feed, URL shortener, Rate limiter, Search)
- 5 machine coding templates (ParkingLot, Splitwise, LRU, RateLimiter, Scheduler)
- 8 STAR stories

### Technique Checklist
- **DSA**: Understand → Brute force → Optimize → Code → Test → Analyze
- **System Design**: Requirements → Estimate → High-level → Deep dive → Bottlenecks → Trade-offs
- **Machine Coding**: Clarify → Class design → Patterns → Implement core → Tests → Stretch features
- **Behavioral**: Situation → Task → Action (bulk) → Result (quantified)

### Day-of-interview
- Sleep 8 hours
- Eat light breakfast
- Water available
- Test webcam + mic + IDE
- Calm breathing

### Mental Posture
Confidence ≠ arrogance. Show:
- Genuine curiosity about the problem
- Think out loud
- Ask clarifying questions
- Admit when you don't know (and show how you'd find out)
- Recover gracefully from mistakes`,
    problems: [],
    eveningSpec: "Rest. Prep setup. Sleep early.",
    resources: [],
    successCriteria: ["Ready. Confident. Slept."],
  },
};
