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
    requirements: ["N elevators, M floors", "Up/Down requests from any floor", "Internal floor selection inside elevator", "SCAN or LOOK scheduling", "Minimize wait time"],
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
  },
  {
    id: "mc-infinite-scroll",
    n: "Infinite Scroll Feed",
    track: "fe",
    d: "Medium",
    t: "60 min",
    r: "Paginated fetch, loading indicator, IntersectionObserver, scroll position restore",
    c: "Flipkart, Swiggy, Zomato",
  },
  {
    id: "mc-kanban",
    n: "Kanban Board (Trello-like)",
    track: "fe",
    d: "Hard",
    t: "90 min",
    r: "Drag-drop cards between columns, add/edit/delete, reorder within column",
    c: "Atlassian, Flipkart, Swiggy",
  },
  {
    id: "mc-modal",
    n: "Modal / Dialog Component",
    track: "fe",
    d: "Easy",
    t: "45 min",
    r: "Open/close, overlay click dismiss, Escape key, focus trap, portal rendering, animation",
    c: "Very frequently asked",
  },
  {
    id: "mc-cart",
    n: "Shopping Cart",
    track: "fe",
    d: "Medium",
    t: "60 min",
    r: "Add/remove items, quantity +/-, price calc, coupon code, empty state, persist cart",
    c: "Swiggy, Zomato, Myntra",
  },
  {
    id: "mc-datatable",
    n: "Data Table with Sort/Filter",
    track: "fe",
    d: "Medium",
    t: "75 min",
    r: "Column sort, text filter, pagination, column resize, row selection",
    c: "Walmart, Atlassian, Razorpay",
  },
];
