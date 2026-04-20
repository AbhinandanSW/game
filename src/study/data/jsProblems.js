export const JS_PROBLEMS = [
  // ─── Polyfills ─────────────────────────────────────────
  { cat: "Polyfills", n: "Array.prototype.map", d: "Easy", concepts: "Prototypes, this, callbacks", hint: "Handle sparse arrays, thisArg parameter", c: "Flipkart, Swiggy, Paytm",
    desc: "Implement a polyfill for Array.prototype.map. Takes a callback and optional thisArg, returns a new array with callback's return value for each element. Must handle sparse arrays (holes) — don't call callback on missing indices.",
    starter: `Array.prototype.myMap = function(callback, thisArg) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) result[i] = callback.call(thisArg, this[i], i, this);
  }
  return result;
};

// Test
console.log([1, 2, 3].myMap(x => x * 2));          // [2, 4, 6]
console.log([1, , 3].myMap(x => x * 2));           // [2, <empty>, 6]
console.log([1].myMap(function() { return this; }, { a: 1 })); // [{a:1}]`,
  },
  { cat: "Polyfills", n: "Array.prototype.filter", d: "Easy", concepts: "Prototypes, predicates", hint: "Return new array, preserve indices", c: "Zomato, PhonePe",
    desc: "Implement Array.prototype.filter polyfill. Return new array with only elements for which callback returns truthy.",
    starter: `Array.prototype.myFilter = function(cb, thisArg) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this && cb.call(thisArg, this[i], i, this)) result.push(this[i]);
  }
  return result;
};
console.log([1, 2, 3, 4].myFilter(x => x % 2 === 0)); // [2, 4]`,
  },
  { cat: "Polyfills", n: "Array.prototype.reduce", d: "Medium", concepts: "Accumulators, initial value", hint: "Handle no initialValue case (use arr[0])", c: "Google, Amazon, Flipkart",
    desc: "Implement Array.prototype.reduce polyfill. Handle both cases: with and without initial value.",
    starter: `Array.prototype.myReduce = function(callback, initialValue) {
  let acc, startIdx;
  if (arguments.length >= 2) {
    acc = initialValue; startIdx = 0;
  } else {
    if (this.length === 0) throw new TypeError('Reduce of empty array with no initial value');
    acc = this[0]; startIdx = 1;
  }
  for (let i = startIdx; i < this.length; i++) {
    if (i in this) acc = callback(acc, this[i], i, this);
  }
  return acc;
};

console.log([1, 2, 3, 4].myReduce((acc, x) => acc + x, 0)); // 10
console.log([1, 2, 3].myReduce((acc, x) => acc + x));        // 6 (no init)`,
  },
  { cat: "Polyfills", n: "Function.prototype.bind", d: "Medium", concepts: "this binding, partial application", hint: "Return new function, handle new operator", c: "Google, Microsoft, Razorpay",
    desc: "Implement Function.prototype.bind polyfill. Return new function with bound this and pre-filled args. Must also work with `new` operator — then `this` should be the new instance, not bound context.",
    starter: `Function.prototype.myBind = function(ctx, ...preArgs) {
  const fn = this;
  function bound(...args) {
    const isNew = this instanceof bound;
    return fn.apply(isNew ? this : ctx, [...preArgs, ...args]);
  }
  bound.prototype = Object.create(fn.prototype);
  return bound;
};

function greet(greeting, name) { return greeting + ', ' + name + ' (' + this.role + ')'; }
const g = greet.myBind({ role: 'admin' }, 'Hi');
console.log(g('Alex'));    // "Hi, Alex (admin)"
function Car(make) { this.make = make; }
const BoundCar = Car.myBind(null, 'Toyota');
console.log(new BoundCar().make);  // "Toyota"`,
  },
  { cat: "Polyfills", n: "Function.prototype.call/apply", d: "Medium", concepts: "this context, spread args", hint: "Assign fn to context obj, invoke, delete", c: "Walmart, Atlassian",
    desc: "Implement call and apply polyfills. The trick: temporarily attach fn as a method on context, invoke, then clean up. Use Symbol to avoid key collisions.",
    starter: `Function.prototype.myCall = function(ctx, ...args) {
  ctx = ctx || globalThis;
  const key = Symbol();
  ctx[key] = this;
  const result = ctx[key](...args);
  delete ctx[key];
  return result;
};

Function.prototype.myApply = function(ctx, args) {
  return this.myCall(ctx, ...(args || []));
};

function show(a, b) { return this.x + a + b; }
console.log(show.myCall({ x: 10 }, 1, 2));       // 13
console.log(show.myApply({ x: 10 }, [1, 2]));    // 13`,
  },
  { cat: "Polyfills", n: "Promise.all", d: "Medium", concepts: "Promise, async aggregation", hint: "Track count, reject on first failure", c: "Flipkart, Amazon, Swiggy",
    desc: "Implement Promise.all. Resolves with array of all results (in order) when all promises fulfill. Rejects on first rejection.",
    starter: `function promiseAll(promises) {
  return new Promise((resolve, reject) => {
    if (!promises.length) return resolve([]);
    const results = new Array(promises.length);
    let done = 0;
    promises.forEach((p, i) => {
      Promise.resolve(p).then(
        (v) => {
          results[i] = v;
          if (++done === promises.length) resolve(results);
        },
        reject
      );
    });
  });
}

promiseAll([Promise.resolve(1), 2, Promise.resolve(3)]).then(console.log); // [1,2,3]
promiseAll([Promise.resolve(1), Promise.reject('x')]).catch(console.log);  // 'x'`,
  },
  { cat: "Polyfills", n: "Promise.allSettled", d: "Medium", concepts: "Promise, status tracking", hint: "Always resolve with status objects", c: "Google, PhonePe",
    desc: "Implement Promise.allSettled. Always resolves (never rejects). Returns array of { status: 'fulfilled', value } or { status: 'rejected', reason }.",
    starter: `function allSettled(promises) {
  return Promise.all(promises.map(p =>
    Promise.resolve(p).then(
      v => ({ status: 'fulfilled', value: v }),
      e => ({ status: 'rejected', reason: e })
    )
  ));
}

allSettled([Promise.resolve(1), Promise.reject('err'), 3]).then(console.log);`,
  },
  { cat: "Polyfills", n: "Promise.race", d: "Easy", concepts: "Promise resolution", hint: "First to settle wins", c: "Meesho, CRED",
    desc: "Implement Promise.race. Resolves/rejects with first promise to settle.",
    starter: `function race(promises) {
  return new Promise((resolve, reject) => {
    promises.forEach(p => Promise.resolve(p).then(resolve, reject));
  });
}
race([new Promise(r => setTimeout(() => r('slow'), 100)), Promise.resolve('fast')]).then(console.log); // 'fast'`,
  },
  { cat: "Polyfills", n: "Promise from scratch", d: "Hard", concepts: "Microtasks, state machine", hint: "States: pending → fulfilled/rejected, then chain", c: "Google, Amazon, Uber",
    desc: "Implement a Promises/A+ compliant Promise from scratch. State machine: pending → fulfilled or rejected (once, immutable). Handlers via .then should be called asynchronously (queueMicrotask). Chaining: then returns new Promise.",
    starter: `class MyPromise {
  constructor(executor) {
    this.state = 'pending';
    this.value = undefined;
    this.handlers = [];
    const resolve = (v) => this._settle('fulfilled', v);
    const reject = (e) => this._settle('rejected', e);
    try { executor(resolve, reject); } catch (e) { reject(e); }
  }
  _settle(state, value) {
    if (this.state !== 'pending') return;
    this.state = state; this.value = value;
    queueMicrotask(() => this.handlers.forEach(h => this._run(h)));
  }
  then(onF, onR) {
    return new MyPromise((resolve, reject) => {
      const handler = { onF, onR, resolve, reject };
      if (this.state === 'pending') this.handlers.push(handler);
      else queueMicrotask(() => this._run(handler));
    });
  }
  _run({ onF, onR, resolve, reject }) {
    const cb = this.state === 'fulfilled' ? onF : onR;
    if (typeof cb !== 'function') {
      return this.state === 'fulfilled' ? resolve(this.value) : reject(this.value);
    }
    try {
      const r = cb(this.value);
      if (r instanceof MyPromise) r.then(resolve, reject);
      else resolve(r);
    } catch (e) { reject(e); }
  }
  catch(onR) { return this.then(undefined, onR); }
}

new MyPromise((res) => setTimeout(() => res(42), 50))
  .then(v => v * 2)
  .then(console.log); // 84`,
  },
  { cat: "Polyfills", n: "Object.create", d: "Medium", concepts: "Prototypal inheritance", hint: "Empty constructor + prototype assignment", c: "Atlassian, Razorpay",
    desc: "Implement Object.create polyfill. Create object with specified prototype (and optional property descriptors).",
    starter: `Object.myCreate = function(proto) {
  function F() {}
  F.prototype = proto;
  return new F();
};
const parent = { greet() { return 'hi'; } };
const child = Object.myCreate(parent);
console.log(child.greet()); // 'hi'`,
  },

  // ─── Closures ──────────────────────────────────────────
  { cat: "Closures", n: "Counter with closure", d: "Easy", concepts: "Closure, private state", hint: "Return increment/decrement/getValue", c: "Swiggy, Ola, Paytm",
    desc: "Create a counter factory using closure. Returns { inc, dec, get, reset }. Count is private — not accessible from outside.",
    starter: `function makeCounter(start = 0) {
  let count = start;
  return {
    inc: () => ++count,
    dec: () => --count,
    get: () => count,
    reset: () => count = start,
  };
}

const c = makeCounter();
c.inc(); c.inc(); c.dec();
console.log(c.get()); // 1
c.reset();
console.log(c.get()); // 0
console.log(c.count); // undefined — private`,
  },
  { cat: "Closures", n: "Memoize function", d: "Medium", concepts: "Closure, caching, serialization", hint: "Use JSON.stringify for cache key", c: "Google, Flipkart, Uber",
    desc: "Implement memoize(fn) that caches results. Args become cache key. Handle complex arg types via JSON.stringify.",
    starter: `function memoize(fn) {
  const cache = new Map();
  return function(...args) {
    const key = JSON.stringify(args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

let calls = 0;
const slow = (n) => { calls++; return n * n; };
const fast = memoize(slow);
fast(5); fast(5); fast(5);
console.log(calls); // 1 — computed once`,
  },
  { cat: "Closures", n: "once() — run once", d: "Easy", concepts: "Closure, flag variable", hint: "Set flag after first call, return cached", c: "PhonePe, CRED",
    desc: "once(fn) — returns a function that invokes fn exactly once. Subsequent calls return the first invocation's result.",
    starter: `function once(fn) {
  let called = false, result;
  return function(...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}

const init = once(() => { console.log('init!'); return 42; });
init(); init(); init(); // prints 'init!' only once, returns 42 all three times`,
  },
  { cat: "Closures", n: "Currying (infinite & fixed)", d: "Medium", concepts: "Closure, recursion, toString", hint: "Return function until all args collected", c: "Amazon, Flipkart, Atlassian",
    desc: "Implement curry(fn). Two modes: (1) fixed-arity — returns function until all args collected; (2) infinite sum — keep summing until called with no args.",
    starter: `// Fixed-arity curry
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) return fn.apply(this, args);
    return (...next) => curried(...args, ...next);
  };
}

const add = (a, b, c) => a + b + c;
const c = curry(add);
console.log(c(1)(2)(3));   // 6
console.log(c(1, 2)(3));   // 6
console.log(c(1)(2, 3));   // 6

// Infinite sum via toString trick
function sum(n) {
  const inner = (m) => sum(n + m);
  inner.valueOf = () => n;
  return inner;
}
console.log(sum(1)(2)(3)(4) + 0); // 10`,
  },
  { cat: "Closures", n: "Pipe and Compose", d: "Medium", concepts: "Closure, reduce, composition", hint: "pipe: left→right, compose: right→left", c: "Razorpay, Walmart",
    desc: "pipe(f, g, h)(x) = h(g(f(x))). compose(f, g, h)(x) = f(g(h(x))).",
    starter: `const pipe = (...fns) => (x) => fns.reduce((acc, f) => f(acc), x);
const compose = (...fns) => (x) => fns.reduceRight((acc, f) => f(acc), x);

const add1 = x => x + 1;
const mul2 = x => x * 2;
const toStr = x => \`result: \${x}\`;

console.log(pipe(add1, mul2, toStr)(3));    // "result: 8" — (3+1)*2
console.log(compose(toStr, mul2, add1)(3)); // same — right-to-left`,
  },

  // ─── Async ─────────────────────────────────────────────
  { cat: "Async", n: "Debounce with leading/trailing", d: "Medium", concepts: "Timers, closure, this", hint: "Clear prev timer, set new, handle edge opts", c: "All major companies",
    desc: "Implement debounce(fn, wait, options). Delay fn invocation until `wait` ms have passed since last call. Support `leading` (invoke on first call immediately) and `trailing` (invoke after delay).",
    starter: `function debounce(fn, wait, { leading = false, trailing = true } = {}) {
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

let count = 0;
const d = debounce(() => count++, 100);
d(); d(); d();  // only 1 call after 100ms`,
  },
  { cat: "Async", n: "Throttle with leading/trailing", d: "Medium", concepts: "Timers, closure, flags", hint: "Execute first, block till interval passes", c: "All major companies",
    desc: "Throttle — execute at most once per `wait` ms. Leading fires immediately, trailing fires after wait if calls happened during the block.",
    starter: `function throttle(fn, wait) {
  let timer = null, lastArgs = null;
  return function(...args) {
    if (!timer) {
      fn.apply(this, args); // leading
      timer = setTimeout(() => {
        timer = null;
        if (lastArgs) { fn.apply(this, lastArgs); lastArgs = null; }
      }, wait);
    } else {
      lastArgs = args; // trailing
    }
  };
}`,
  },
  { cat: "Async", n: "Sleep / delay function", d: "Easy", concepts: "Promise, setTimeout", hint: "Return promise that resolves after ms", c: "Frequently asked warm-up",
    desc: "sleep(ms) returns a promise that resolves after ms milliseconds.",
    starter: `const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function demo() {
  console.log('start');
  await sleep(1000);
  console.log('1 sec later');
}
demo();`,
  },
  { cat: "Async", n: "Retry with exponential backoff", d: "Medium", concepts: "Recursion, Promise, delay", hint: "Double delay each retry, max retries", c: "Google, Amazon, Uber",
    desc: "Retry an async fn with exponential backoff + jitter. Max retries, max delay.",
    starter: `async function retry(fn, { maxRetries = 5, baseMs = 100, capMs = 10000, jitter = true } = {}) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try { return await fn(); }
    catch (e) {
      if (attempt === maxRetries) throw e;
      let delay = Math.min(capMs, baseMs * 2 ** attempt);
      if (jitter) delay += Math.random() * delay * 0.2;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

let n = 0;
const flaky = () => ++n < 3 ? Promise.reject('fail') : Promise.resolve('ok');
retry(flaky).then(console.log); // 'ok' after 3 attempts`,
  },
  { cat: "Async", n: "Promise-based task queue", d: "Hard", concepts: "Promise, queue, concurrency", hint: "Track running count, dequeue when slot opens", c: "Google, Flipkart, Uber",
    desc: "Queue that runs at most N tasks in parallel. Each task is an async function. Returns promises that resolve with task results.",
    starter: `class TaskQueue {
  constructor(concurrency = 3) {
    this.concurrency = concurrency;
    this.queue = [];
    this.running = 0;
  }
  add(task) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject });
      this._next();
    });
  }
  _next() {
    if (this.running >= this.concurrency) return;
    const item = this.queue.shift();
    if (!item) return;
    this.running++;
    item.task()
      .then(item.resolve, item.reject)
      .finally(() => { this.running--; this._next(); });
  }
}

const q = new TaskQueue(2);
[1,2,3,4,5].forEach(i => q.add(async () => {
  await new Promise(r => setTimeout(r, 100));
  return i * 2;
}).then(console.log));`,
  },
  { cat: "Async", n: "Async parallel/series/waterfall", d: "Medium", concepts: "Promise chaining patterns", hint: "Series: await loop, Parallel: Promise.all", c: "Atlassian, Walmart",
    desc: "Three patterns for coordinating async: series (one after another), parallel (all at once), waterfall (output of one → input of next).",
    starter: `// Series — in order, sequential
async function series(tasks) {
  const results = [];
  for (const t of tasks) results.push(await t());
  return results;
}

// Parallel
const parallel = (tasks) => Promise.all(tasks.map(t => t()));

// Waterfall
async function waterfall(tasks) {
  let result;
  for (const t of tasks) result = await t(result);
  return result;
}

waterfall([
  async () => 1,
  async (x) => x + 1,
  async (x) => x * 10,
]).then(console.log); // 20`,
  },

  // ─── Utilities ─────────────────────────────────────────
  { cat: "Utilities", n: "Deep clone (all types)", d: "Hard", concepts: "Recursion, type checking, circular", hint: "WeakMap for circular, handle Date/Regex/Map/Set", c: "Amazon, Flipkart, Google",
    desc: "Deep clone any value. Handle: primitives, arrays, plain objects, Date, RegExp, Map, Set, and circular references via WeakMap.",
    starter: `function deepClone(obj, seen = new WeakMap()) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (seen.has(obj)) return seen.get(obj);

  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);

  if (obj instanceof Map) {
    const m = new Map(); seen.set(obj, m);
    for (const [k, v] of obj) m.set(deepClone(k, seen), deepClone(v, seen));
    return m;
  }
  if (obj instanceof Set) {
    const s = new Set(); seen.set(obj, s);
    for (const v of obj) s.add(deepClone(v, seen));
    return s;
  }

  const clone = Array.isArray(obj) ? [] : Object.create(Object.getPrototypeOf(obj));
  seen.set(obj, clone);
  for (const key of Reflect.ownKeys(obj)) clone[key] = deepClone(obj[key], seen);
  return clone;
}

const a = { x: 1, arr: [1, 2, { y: 3 }], d: new Date() };
a.self = a;  // circular
const b = deepClone(a);
console.log(b.arr[2] !== a.arr[2], b.self === b);  // true true`,
  },
  { cat: "Utilities", n: "Deep equal / isEqual", d: "Medium", concepts: "Recursion, type comparison", hint: "Handle NaN, check key count, recurse values", c: "Atlassian, Razorpay",
    desc: "Deep equality check. Same type, same keys, recursively equal values. Handle NaN === NaN as true.",
    starter: `function isEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return Number.isNaN(a) && Number.isNaN(b);
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k => isEqual(a[k], b[k]));
}

console.log(isEqual({ a: 1, b: [1, 2] }, { a: 1, b: [1, 2] })); // true
console.log(isEqual({ a: 1 }, { a: 1, b: 2 }));                  // false
console.log(isEqual(NaN, NaN));                                  // true`,
  },
  { cat: "Utilities", n: "Flatten array (any depth)", d: "Medium", concepts: "Recursion, Array.isArray", hint: "Recursive concat or iterative stack approach", c: "Very frequently asked",
    desc: "flatten(arr, depth = Infinity). Flatten nested arrays up to depth levels.",
    starter: `function flatten(arr, depth = Infinity) {
  return depth > 0
    ? arr.reduce((acc, x) => acc.concat(Array.isArray(x) ? flatten(x, depth - 1) : x), [])
    : arr.slice();
}

console.log(flatten([1, [2, [3, [4]]]]));        // [1, 2, 3, 4]
console.log(flatten([1, [2, [3, [4]]]], 2));     // [1, 2, 3, [4]]
console.log(flatten([1, [2, [3, [4]]]], 0));     // [1, [2, [3, [4]]]]`,
  },
  { cat: "Utilities", n: "Flatten object (dot keys)", d: "Medium", concepts: "Recursion, string concat", hint: "Build keys with dot separator recursively", c: "Google, Flipkart",
    desc: "Flatten nested object to single-level with dot keys.",
    starter: `function flattenObject(obj, prefix = '', result = {}) {
  for (const key of Object.keys(obj)) {
    const newKey = prefix ? \`\${prefix}.\${key}\` : key;
    if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
      flattenObject(obj[key], newKey, result);
    } else {
      result[newKey] = obj[key];
    }
  }
  return result;
}

console.log(flattenObject({ a: 1, b: { c: 2, d: { e: 3 } } }));
// { a: 1, 'b.c': 2, 'b.d.e': 3 }`,
  },
  { cat: "Utilities", n: "Deep merge objects", d: "Medium", concepts: "Recursion, type checking", hint: "Handle arrays, nested objects, overwrite", c: "Amazon, Atlassian",
    desc: "Deep-merge source into target. Later sources override. Arrays by default are replaced (not concatenated) — but configurable.",
    starter: `function deepMerge(target, ...sources) {
  for (const source of sources) {
    if (!source) continue;
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])
          && target[key] && typeof target[key] === 'object') {
        deepMerge(target[key], source[key]);
      } else {
        target[key] = source[key];
      }
    }
  }
  return target;
}

console.log(deepMerge({ a: { x: 1, y: 2 } }, { a: { y: 3, z: 4 } }));
// { a: { x: 1, y: 3, z: 4 } }`,
  },
  { cat: "Utilities", n: "get() / set() by path (lodash)", d: "Medium", concepts: "String split, reduce, brackets", hint: "Split path on '.', walk object tree", c: "Flipkart, Uber, Razorpay",
    desc: "lodash-style get/set by path string. Supports dot notation and bracket access.",
    starter: `function get(obj, path, defaultValue) {
  const keys = path.split(/[.[\\]]/).filter(Boolean);
  let cur = obj;
  for (const k of keys) {
    if (cur == null) return defaultValue;
    cur = cur[k];
  }
  return cur === undefined ? defaultValue : cur;
}

function set(obj, path, value) {
  const keys = path.split(/[.[\\]]/).filter(Boolean);
  let cur = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]] || typeof cur[keys[i]] !== 'object') {
      cur[keys[i]] = isNaN(keys[i+1]) ? {} : [];
    }
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
  return obj;
}

console.log(get({ a: { b: [10, 20] } }, 'a.b[1]'));  // 20
const o = {};
set(o, 'a.b.c', 5);
console.log(o);  // { a: { b: { c: 5 } } }`,
  },
  { cat: "Utilities", n: "Custom JSON.stringify", d: "Hard", concepts: "Recursion, type handling", hint: "Handle undefined, functions, circular, toJSON()", c: "Google, Amazon",
    desc: "Implement JSON.stringify. Skip undefined, functions, symbols. Respect toJSON() method. Throw on circular references (like native).",
    starter: `function stringify(val) {
  if (val === null) return 'null';
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'string') return JSON.stringify(val); // shortcut for escape logic
  if (typeof val === 'undefined' || typeof val === 'function' || typeof val === 'symbol') return undefined;
  if (val.toJSON) return stringify(val.toJSON());
  if (Array.isArray(val)) {
    return '[' + val.map(v => stringify(v) ?? 'null').join(',') + ']';
  }
  const pairs = [];
  for (const key of Object.keys(val)) {
    const v = stringify(val[key]);
    if (v !== undefined) pairs.push(JSON.stringify(key) + ':' + v);
  }
  return '{' + pairs.join(',') + '}';
}

console.log(stringify({ a: 1, b: undefined, c: () => {}, d: [1, undefined, 3] }));
// '{"a":1,"d":[1,null,3]}'`,
  },

  // ─── Event / DOM ───────────────────────────────────────
  { cat: "Event/DOM", n: "Event Emitter", d: "Medium", concepts: "Pub/Sub, Map, closure", hint: "Store listeners map, once wraps & removes", c: "Very High frequency",
    desc: "EventEmitter class with on/off/emit/once. once wraps handler so it auto-removes after first call. Return unsubscribe function from on().",
    starter: `class EventEmitter {
  constructor() { this.listeners = new Map(); }
  on(event, fn) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(fn);
    return () => this.off(event, fn);
  }
  off(event, fn) { this.listeners.get(event)?.delete(fn); }
  emit(event, ...args) { this.listeners.get(event)?.forEach(fn => fn(...args)); }
  once(event, fn) {
    const wrap = (...args) => { fn(...args); this.off(event, wrap); };
    return this.on(event, wrap);
  }
}

const e = new EventEmitter();
const unsub = e.on('msg', (v) => console.log('got', v));
e.emit('msg', 1); // got 1
unsub();
e.emit('msg', 2); // nothing
e.once('hi', () => console.log('one-shot'));
e.emit('hi'); e.emit('hi'); // fires once`,
  },
  { cat: "Event/DOM", n: "Virtual DOM diff algorithm", d: "Hard", concepts: "Trees, recursion, DOM API", hint: "Compare type, props, children recursively", c: "Flipkart, Amazon",
    desc: "Build mini-VDOM with h(tag, props, children), render to DOM, diff + patch on update.",
    starter: `function h(tag, props = {}, ...children) {
  return { tag, props, children: children.flat() };
}

function render(vnode) {
  if (typeof vnode === 'string' || typeof vnode === 'number') return document.createTextNode(vnode);
  const el = document.createElement(vnode.tag);
  for (const [k, v] of Object.entries(vnode.props || {})) {
    if (k.startsWith('on')) el.addEventListener(k.slice(2).toLowerCase(), v);
    else el.setAttribute(k, v);
  }
  vnode.children.forEach(c => el.appendChild(render(c)));
  return el;
}

// diff + patch left as exercise`,
  },

  // ─── Prototypes ────────────────────────────────────────
  { cat: "Prototypes", n: "Implement new operator", d: "Medium", concepts: "Object.create, constructor", hint: "Create obj from prototype, call fn, check return", c: "Google, Flipkart",
    desc: "Implement `new`. (1) Create object from constructor's prototype. (2) Call constructor with `this`. (3) If constructor returned an object, use that; else use the new obj.",
    starter: `function myNew(Constructor, ...args) {
  const obj = Object.create(Constructor.prototype);
  const result = Constructor.apply(obj, args);
  return (result && typeof result === 'object') ? result : obj;
}

function Person(name) { this.name = name; }
Person.prototype.greet = function() { return 'Hi ' + this.name; };
const p = myNew(Person, 'Alex');
console.log(p.greet(), p instanceof Person); // 'Hi Alex' true`,
  },
  { cat: "Prototypes", n: "Implement instanceof", d: "Easy", concepts: "Prototype chain walking", hint: "Walk __proto__ chain, compare with .prototype", c: "Frequently asked",
    desc: "Implement instanceof: walk object's prototype chain, return true if any match's Constructor.prototype.",
    starter: `function myInstanceof(obj, Constructor) {
  let proto = Object.getPrototypeOf(obj);
  while (proto) {
    if (proto === Constructor.prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}

class Animal {} class Dog extends Animal {}
const d = new Dog();
console.log(myInstanceof(d, Dog), myInstanceof(d, Animal)); // true true`,
  },
  { cat: "Prototypes", n: "Class-based inheritance (ES5)", d: "Medium", concepts: "Constructor stealing, prototype chain", hint: "Child.prototype = Object.create(Parent.prototype)", c: "Atlassian, Walmart",
    desc: "ES6 classes in plain ES5. Show the prototype-chain plumbing.",
    starter: `function Animal(name) { this.name = name; }
Animal.prototype.eat = function() { return this.name + ' eats'; };

function Dog(name, breed) {
  Animal.call(this, name);  // constructor stealing
  this.breed = breed;
}
Dog.prototype = Object.create(Animal.prototype);
Dog.prototype.constructor = Dog;
Dog.prototype.bark = function() { return 'woof'; };

const d = new Dog('Rex', 'lab');
console.log(d.eat(), d.bark(), d instanceof Animal);  // Rex eats, woof, true`,
  },
  { cat: "Prototypes", n: "Method chaining pattern", d: "Easy", concepts: "this return, fluent interface", hint: "Return this from each method", c: "Warm-up question",
    desc: "Build a fluent calculator where methods return this.",
    starter: `class Calc {
  constructor(v = 0) { this.v = v; }
  add(n) { this.v += n; return this; }
  mul(n) { this.v *= n; return this; }
  sub(n) { this.v -= n; return this; }
  val() { return this.v; }
}
console.log(new Calc(10).add(5).mul(2).sub(3).val()); // 27`,
  },
  { cat: "Prototypes", n: "Object.assign", d: "Medium", concepts: "Property enumeration, shallow copy", hint: "Loop own enumerable props, handle symbols", c: "PhonePe, Razorpay",
    desc: "Implement Object.assign. Copies own enumerable string and symbol keys from sources to target.",
    starter: `Object.myAssign = function(target, ...sources) {
  if (target == null) throw new TypeError('Cannot convert undefined or null to object');
  const to = Object(target);
  for (const source of sources) {
    if (source == null) continue;
    for (const key of Reflect.ownKeys(source)) {
      const desc = Object.getOwnPropertyDescriptor(source, key);
      if (desc && desc.enumerable) to[key] = source[key];
    }
  }
  return to;
};

console.log(Object.myAssign({ a: 1 }, { b: 2 }, { a: 3 }));  // { a: 3, b: 2 }`,
  },

  // ─── Output Questions ──────────────────────────────────
  { cat: "Output Questions", n: "Closure in for loop (var vs let)", d: "Easy", concepts: "Closure, block scope", hint: "var shares scope, let creates new binding per iter", c: "Very High frequency",
    desc: "Predict output of both loops and explain.",
    starter: `// var
for (var i = 0; i < 3; i++) setTimeout(() => console.log('var:', i), 10);

// let
for (let i = 0; i < 3; i++) setTimeout(() => console.log('let:', i), 10);

// Output:
//   var: 3 (three times) — single shared i, by the time setTimeout runs, loop is done
//   let: 0, 1, 2 — let creates new binding each iteration`,
  },
  { cat: "Output Questions", n: "Promise execution order", d: "Medium", concepts: "Microtask queue, event loop", hint: "Microtasks (then) before macrotasks (setTimeout)", c: "Very High frequency",
    desc: "Trace order of output. Microtasks drain before next macrotask.",
    starter: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
Promise.resolve().then(() => console.log('4'));
console.log('5');

// Output: 1, 5, 3, 4, 2
// Why: sync (1, 5) → drain microtasks (3, 4) → macrotask (2)`,
  },
  { cat: "Output Questions", n: "this in arrow vs regular fns", d: "Medium", concepts: "Lexical this, binding rules", hint: "Arrow inherits outer this, regular depends on call", c: "High frequency",
    desc: "Predict output and explain why arrow differs.",
    starter: `const obj = {
  name: 'Alex',
  regular: function() { return this.name; },
  arrow: () => this.name,  // 'this' = outer (globalThis or undefined)
  method: function() {
    const inner = () => this.name;       // arrow: inherits method's this (obj)
    const innerReg = function() { return this.name; };  // regular: default = undefined
    return { inner: inner(), innerReg: innerReg() };
  }
};
console.log(obj.regular());         // 'Alex'
console.log(obj.arrow());           // undefined
console.log(obj.method());          // { inner: 'Alex', innerReg: undefined }`,
  },
  { cat: "Output Questions", n: "Prototype chain lookups", d: "Medium", concepts: "__proto__, hasOwnProperty", hint: "Property lookup walks chain till null", c: "High frequency",
    desc: "When accessing obj.prop, JS walks prototype chain. Predict these.",
    starter: `const parent = { greet: 'hi' };
const child = Object.create(parent);
child.name = 'Alex';

console.log(child.name);      // 'Alex' (own)
console.log(child.greet);     // 'hi' (inherited)
console.log(child.hasOwnProperty('name'));   // true
console.log(child.hasOwnProperty('greet'));  // false

// Override
child.greet = 'hello';
console.log(parent.greet);    // 'hi' unchanged
console.log(child.greet);     // 'hello' (own shadows parent)`,
  },
  { cat: "Output Questions", n: "Event loop ordering", d: "Medium", concepts: "Task queue ordering", hint: "Microtask → Macrotask → rAF", c: "Very High frequency",
    desc: "Predict complete output with all timing primitives.",
    starter: `console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => {
  console.log('C');
  setTimeout(() => console.log('D'), 0);
  Promise.resolve().then(() => console.log('E'));
});
console.log('F');

// Output: A, F, C, E, B, D
// 1. A, F (sync)
// 2. C (microtask), E (microtask added during C — drains before next macro)
// 3. B (macrotask)
// 4. D (macrotask added during C)`,
  },
].map((x, i) => ({ ...x, id: `js-${i}`, starter: x.starter || `// ${x.n}\n// ${x.hint}\n\n// your code here\n` }));
