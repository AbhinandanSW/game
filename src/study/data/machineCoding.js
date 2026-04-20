export const MACHINE_CODING = [
  {
    id: "mc-parkinglot",
    n: "Parking Lot System",
    track: "be",
    d: "Medium",
    t: "60-90 min",
    p: "Strategy (pricing), Factory (vehicle), Singleton",
    r: "Multi-floor, Vehicle type slots, Entry/Exit, Pricing, Receipt, Availability, Nearest spot",
    c: "Flipkart, Swiggy, PhonePe",
    desc: "Design a parking lot system that manages multiple floors with different vehicle types (bike, car, truck), computes pricing, issues tickets, finds nearest available spot.",
    requirements: [
      "Support multiple floors, each with multiple spots",
      "Spots have types (Compact, Regular, Large, Handicapped)",
      "Vehicle types: Bike, Car, Truck with size requirements",
      "Entry: allocate nearest fitting spot, issue ticket",
      "Exit: compute fee based on duration + vehicle type, release spot",
      "Query: available spots per floor/type",
    ],
    classes: `**Entities:**
- ParkingLot (singleton)
  - floors: List<Floor>
  - pricingStrategy: PricingStrategy
  - park(vehicle): Ticket
  - exit(ticket): Receipt
- Floor
  - spots: List<Spot>
  - getAvailableSpot(VehicleType): Spot
- Spot
  - id, type, isOccupied, currentVehicle
- Vehicle (abstract)
  - licensePlate, type
  - Subclasses: Bike, Car, Truck
- Ticket
  - id, spotId, entryTime, vehicleId
- PricingStrategy (interface)
  - computeFee(entryTime, exitTime, vehicleType)
  - Implementations: HourlyPricing, DayPricing

**Design Patterns:**
- **Singleton**: ParkingLot
- **Factory**: Vehicle creation
- **Strategy**: Pricing (swap algorithms)
- **Observer**: Notify display board on spot state change`,
    starter: `// Define classes: ParkingLot, Floor, Spot, Vehicle, Ticket, PricingStrategy
// Implement park() and exit() methods

class ParkingLot {
  constructor(floors) {
    // TODO
  }
  park(vehicle) {
    // Find nearest spot, occupy it, issue ticket
  }
  exit(ticketId) {
    // Release spot, compute fee, return receipt
  }
}`,
  },
  {
    id: "mc-splitwise",
    n: "Splitwise / Expense Sharing",
    track: "be",
    d: "Hard",
    t: "60-90 min",
    p: "Strategy (split), Observer, Facade",
    r: "Add expense, Split types, Debt simplification (graph-based), Show balances, Groups",
    c: "CRED, PhonePe, Razorpay",
    desc: "Build an expense sharing app where users can add expenses in a group, split by various strategies (equal, exact, percentage, shares), and simplify debts.",
    requirements: [
      "Users, Groups, Expenses",
      "Split strategies: Equal, Exact amounts, Percentage, Shares",
      "Track who owes whom",
      "Debt simplification: minimize transactions (graph-based)",
      "Activity feed, balance summary",
    ],
    classes: `**Entities:**
- User (id, name, email)
- Group (id, name, members: List<User>, expenses: List<Expense>)
- Expense (id, amount, paidBy, splits: List<Split>, timestamp)
- Split (userId, amount)
- SplitStrategy (interface) → EqualSplit, ExactSplit, PercentageSplit
- Balance Manager: Map<UserId, Map<UserId, Amount>>
- DebtSimplifier: graph algorithm to minimize transactions

**Design Patterns:**
- **Strategy**: Split algorithms
- **Observer**: Notify users on new expense
- **Facade**: ExpenseManagerFacade (coordinates Balance + DebtSimplifier)`,
    starter: `class Splitwise {
  addUser(name) { /* ... */ }
  createGroup(name, userIds) { /* ... */ }
  addExpense(groupId, paidBy, amount, splitStrategy, splitDetails) { /* ... */ }
  showBalance(userId) { /* ... */ }
  simplifyDebts(groupId) { /* ... */ }
}`,
  },
  {
    id: "mc-rate-limiter",
    n: "Rate Limiter",
    track: "be",
    d: "Medium",
    t: "45-60 min",
    p: "Strategy, Factory, Chain of Responsibility",
    r: "Token bucket, Sliding window, Fixed window, Per-user/API config, Distributed",
    c: "Razorpay, PhonePe, All MNCs",
    desc: "Implement multiple rate limiting algorithms. Make it configurable per user and per endpoint.",
    requirements: [
      "Support Token Bucket, Fixed Window, Sliding Window algorithms",
      "Configurable limits per user/endpoint",
      "Thread-safe",
      "Return whether request is allowed + remaining quota",
    ],
    classes: `**Entities:**
- RateLimiter (interface) - allow(userId, endpoint): boolean
- TokenBucketRateLimiter, FixedWindowRateLimiter, SlidingWindowRateLimiter
- RateLimitConfig (limit, window, algorithm)
- RateLimitStore (in-memory map or Redis abstraction)`,
    starter: `class TokenBucket {
  constructor(capacity, refillRatePerSec) {
    this.capacity = capacity;
    this.tokens = capacity;
    this.refillRate = refillRatePerSec;
    this.lastRefill = Date.now();
  }
  allow() {
    // Refill tokens based on elapsed time, take 1, return true/false
  }
}

class RateLimiterService {
  constructor() {
    this.buckets = new Map(); // key → TokenBucket
  }
  allow(userId, endpoint) {
    // TODO
  }
}`,
  },
  {
    id: "mc-lru",
    n: "LRU + LFU Cache",
    track: "be",
    d: "Hard",
    t: "45-60 min",
    p: "Strategy (eviction), Template Method",
    r: "GET/PUT O(1), LRU eviction, LFU eviction, TTL support, Size-bounded, Statistics",
    c: "All companies",
    desc: "Implement in-memory cache with pluggable eviction policies. Both GET and PUT must be O(1).",
    requirements: ["O(1) get, put, delete", "LRU (HashMap + DLL)", "LFU (HashMap + freq buckets)", "TTL support", "Cache stats (hit/miss)"],
    starter: `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // Maps preserve insertion order
  }
  get(key) {
    // Remove and re-insert to mark as recent
  }
  put(key, value) {
    // Evict oldest (first in map) if full
  }
}`,
  },
  {
    id: "mc-elevator",
    n: "Elevator System",
    track: "be",
    d: "Hard",
    t: "60-90 min",
    p: "Strategy (SCAN/LOOK/FCFS), Observer, State",
    r: "Multi-elevator, Direction optimization, Request queueing, SCAN/LOOK, Door control",
    c: "Flipkart, Google, Amazon",
    desc: "Design a multi-elevator system that efficiently services floor requests.",
    requirements: [
      "N elevators, M floors",
      "External up/down buttons per floor",
      "Internal floor buttons per elevator",
      "SCAN or LOOK scheduling",
      "Assign request to best elevator (closest + direction-aligned)",
      "Door open/close timer",
      "Emergency stop",
      "Minimize average wait time across all requests",
    ],
    classes: `**Entities:**
- ElevatorSystem — orchestrator, request routing
- Elevator — state (floor, direction, requests)
- Request — { fromFloor, direction, targetFloor? }
- SchedulingStrategy — SCAN, LOOK, Nearest
- State machine per elevator: IDLE → MOVING_UP/DOWN → AT_FLOOR → IDLE

**Key decisions:**
- How to assign request — score each elevator by distance + direction match
- When to reverse direction — no more requests in current direction
- Door dwell time — configurable (default 3s)`,
    starter: `class Elevator {
  constructor(id, maxFloor) {
    this.id = id;
    this.floor = 0;
    this.direction = "IDLE"; // UP, DOWN, IDLE
    this.stops = new Set();
  }
  tick() { /* advance, handle arrivals */ }
}
class ElevatorSystem {
  constructor(n, floors) { this.elevators = Array.from({length:n}, (_,i) => new Elevator(i, floors)); }
  request(fromFloor, direction) { /* pick best elevator */ }
}`,
  },
  {
    id: "mc-todo",
    n: "Todo App with Filters",
    track: "fe",
    d: "Easy",
    t: "45 min",
    r: "CRUD, filters (all/active/done), localStorage, bulk actions, edit inline",
    c: "Swiggy, Paytm, PhonePe",
    desc: "Build a Todo app with add, edit, delete, mark complete, filter, persist in localStorage.",
    requirements: ["Add todo via input + Enter", "Toggle complete", "Edit inline on double-click", "Delete", "Filter: All / Active / Completed", "Clear completed", "Persist in localStorage"],
    starter: `import { useState, useEffect } from 'react';

function TodoApp() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState('all');
  const [input, setInput] = useState('');

  // Load from localStorage on mount
  // Save on change

  return (
    <div>
      {/* input, list, filters */}
    </div>
  );
}`,
  },
  {
    id: "mc-autocomplete-ui",
    n: "Autocomplete / Typeahead",
    track: "fe",
    d: "Medium",
    t: "60 min",
    r: "Debounced API calls, keyboard nav, highlight match, cache results, loading state",
    c: "Google, Flipkart, Amazon",
    desc: "Build a search autocomplete component used by millions. Debounced fetching, keyboard navigation, result caching, match highlighting.",
    requirements: [
      "Fetches suggestions on input (debounced ~300ms)",
      "Cancels in-flight request if user types again (AbortController)",
      "Keyboard: Up/Down to navigate, Enter to select, Esc to close",
      "Highlights matching substring in each suggestion",
      "Caches results per query",
      "Shows loading state + empty state",
      "Click outside to dismiss",
      "Accessible (ARIA combobox pattern)",
    ],
    classes: `**Components:**
- Autocomplete — top-level
- SearchInput — controlled input
- SuggestionList — rendered dropdown
- Suggestion — single item with highlight

**Hooks:**
- useDebounce(value, delay)
- useAutocompleteCache(query) — in-memory cache
- useKeyboardNav(items) — up/down/enter

**ARIA:**
- role="combobox" on wrapper
- aria-expanded, aria-activedescendant on input
- role="listbox" on suggestions
- role="option" on each item`,
    starter: `function Autocomplete({ fetcher }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const debouncedQ = useDebounce(query, 300);
  // useEffect to fetch on debouncedQ change, with AbortController
}`,
  },
  {
    id: "mc-infinite-scroll",
    n: "Infinite Scroll Feed",
    track: "fe",
    d: "Medium",
    t: "60 min",
    r: "Paginated fetch, loading indicator, IntersectionObserver, scroll position restore",
    c: "Flipkart, Swiggy, Zomato",
    desc: "Feed that auto-loads more items when user nears the bottom. Handles errors, preserves scroll position on navigation, virtualizes if needed.",
    requirements: [
      "Fetches pages of 20 items lazily",
      "IntersectionObserver detects scroll-end sentinel",
      "Loading spinner during fetch",
      "Error state with retry",
      "End-of-list indicator when no more data",
      "Scroll position restored on back navigation",
      "Optional: virtualize off-screen items for 10k+ list performance",
    ],
    starter: `function InfiniteFeed({ fetcher }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const sentinelRef = useRef(null);
  // IntersectionObserver in useEffect
}`,
  },
  {
    id: "mc-kanban",
    n: "Kanban Board (Trello-like)",
    track: "fe",
    d: "Hard",
    t: "90 min",
    r: "Drag-drop cards between columns, add/edit/delete, reorder within column",
    c: "Atlassian, Flipkart, Swiggy",
    desc: "Trello-style board with columns (Todo/In Progress/Done) and cards that can be drag-dropped between columns and reordered within.",
    requirements: [
      "Multiple columns (configurable)",
      "Add card to any column",
      "Edit card inline (title, description)",
      "Delete card with confirm",
      "Drag to reorder within column",
      "Drag to move between columns",
      "Persist state in localStorage",
      "Responsive (stack on mobile)",
    ],
    classes: `**State shape:**
\`\`\`js
{
  columns: { id, title, cardIds: [] }[],
  cards: { [id]: { id, title, description, createdAt } }
}
\`\`\`
Normalized for O(1) card lookups.

**DnD Options:**
- Use HTML5 drag-drop API (complex, buggy on mobile)
- react-dnd (mature, HTML5 + touch backends)
- dnd-kit (modern, accessible, preferred)
- react-beautiful-dnd (Atlassian — great UX, maintained fork)`,
    starter: `function KanbanBoard() {
  const [state, dispatch] = useReducer(boardReducer, initialState);
  // Use dnd-kit or react-beautiful-dnd
}`,
  },
  {
    id: "mc-modal",
    n: "Modal / Dialog Component",
    track: "fe",
    d: "Easy",
    t: "45 min",
    r: "Open/close, overlay click dismiss, Escape key, focus trap, portal rendering, animation",
    c: "Very frequently asked",
    desc: "Accessible modal component from scratch. Focus trap, ARIA, portal rendering, animation.",
    requirements: [
      "Opens on trigger, closes on: X button, Esc key, overlay click (optional)",
      "Focus moves into modal on open, returns to trigger on close",
      "Focus trapped within modal (Tab cycles within)",
      "Rendered via React Portal (outside main DOM tree)",
      "Animated open/close (fade + scale)",
      "Accessible: role=\"dialog\", aria-labelledby, aria-modal=\"true\"",
      "Prevents body scroll while open",
    ],
    classes: `**API:**
\`\`\`jsx
<Modal open={isOpen} onClose={() => setOpen(false)}>
  <Modal.Title>Are you sure?</Modal.Title>
  <Modal.Body>This action cannot be undone.</Modal.Body>
  <Modal.Actions>
    <Button onClick={onClose}>Cancel</Button>
    <Button danger onClick={confirm}>Delete</Button>
  </Modal.Actions>
</Modal>
\`\`\`

**Focus trap logic:**
On Tab: if last focusable → jump to first.
On Shift+Tab from first → jump to last.`,
    starter: `function Modal({ open, onClose, children }) {
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement;
    // trap focus, handle esc, lock body
    return () => { prevFocus?.focus(); };
  }, [open]);
  if (!open) return null;
  return ReactDOM.createPortal(<div role="dialog">{children}</div>, document.body);
}`,
  },
  {
    id: "mc-cart",
    n: "Shopping Cart",
    track: "fe",
    d: "Medium",
    t: "60 min",
    r: "Add/remove items, quantity +/-, price calc, coupon code, empty state, persist cart",
    c: "Swiggy, Zomato, Myntra",
    desc: "Full-featured shopping cart: add/remove items, quantity controls, price calc with tax + discounts, coupon code redemption, persisted state.",
    requirements: [
      "Add item (merges if already in cart)",
      "Remove item",
      "Increment/decrement quantity (min 1, max = stock)",
      "Live subtotal + tax + discount + total",
      "Apply/remove coupon codes (validate format, compute discount)",
      "Empty cart state",
      "Persist in localStorage",
      "Confirm before remove + bulk clear",
      "Accessible + mobile-responsive",
    ],
    starter: `function cartReducer(state, action) {
  switch(action.type) {
    case 'ADD': /* ... */
    case 'REMOVE': /* ... */
    case 'SET_QTY': /* ... */
    case 'APPLY_COUPON': /* ... */
    default: return state;
  }
}`,
  },
  {
    id: "mc-datatable",
    n: "Data Table with Sort/Filter",
    track: "fe",
    d: "Medium",
    t: "75 min",
    r: "Column sort, text filter, pagination, column resize, row selection",
    c: "Walmart, Atlassian, Razorpay",
    desc: "Enterprise data table. Sort any column, filter per column, paginate, resize columns, select rows (with shift-click range), export.",
    requirements: [
      "Display 1000+ rows (virtualize if > 200)",
      "Click header to sort asc/desc (3-state with neutral)",
      "Per-column text filter in header",
      "Global search",
      "Pagination (10/25/50/100 per page)",
      "Column resize via drag",
      "Row selection (single, shift-range, all-page, all)",
      "Export selected as CSV",
      "Loading skeleton, empty state",
      "Sticky header on scroll",
    ],
    starter: `function DataTable({ columns, rows }) {
  const [sort, setSort] = useState(null);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState(new Set());
  const processed = useMemo(() => { /* sort + filter + paginate */ }, [rows, sort, filters, page]);
}`,
  },
];
