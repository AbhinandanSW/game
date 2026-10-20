// Central route map for the study app.
// Hash routes keep deep links working on static hosts (Vercel, Netlify, GitHub Pages)
// without needing a server-side rewrite.

export const SECTIONS = [
  {
    id: "overview",
    path: "overview",
    label: "Overview",
    icon: "◆",
    desc: "The blueprint, overlap analysis, and everything in one place.",
  },
  {
    id: "dashboard",
    path: "dashboard",
    label: "Dashboard",
    icon: "▦",
    desc: "Your rank, progress, and how friends are doing.",
  },
  {
    id: "dsa",
    path: "dsa",
    label: "DSA",
    icon: "⌘",
    desc: "Curated problems with patterns, tiers, and progress tracking.",
  },
  {
    id: "system-design",
    path: "system-design",
    label: "System Design",
    icon: "◇",
    desc: "FE and BE design prompts with reference approaches.",
  },
  {
    id: "machine-coding",
    path: "machine-coding",
    label: "Machine Coding",
    icon: "⌬",
    desc: "UI katas and backend low-level design with an IDE.",
  },
  {
    id: "concepts",
    path: "concepts",
    label: "Concepts",
    icon: "✦",
    desc: "Deep explanations for the topics interviews probe.",
  },
  {
    id: "plan",
    path: "plan",
    label: "30-Day Plan",
    icon: "▤",
    desc: "A day-by-day schedule for the frontend and backend tracks.",
  },
  {
    id: "js-problems",
    path: "js-problems",
    label: "JS Problems",
    icon: "⚡",
    desc: "Polyfills, async, closures, and prototype mechanics.",
  },
  {
    id: "behavioral",
    path: "behavioral",
    label: "Behavioral",
    icon: "◉",
    desc: "STAR stories for every behavioral round.",
  },
  {
    id: "resources",
    path: "resources",
    label: "Resources",
    icon: "◈",
    desc: "Books, channels, and strategies worth your time.",
  },
  {
    id: "editor",
    path: "editor",
    label: "Editor",
    icon: "✎",
    desc: "Add your own problems, notes, and custom entries.",
  },
  {
    id: "admin",
    path: "admin",
    label: "Admin",
    icon: "★",
    desc: "Manage access requests and content seeding.",
    adminOnly: true,
  },
  {
    id: "login",
    path: "login",
    label: "Sign in",
    icon: "→",
    desc: "Sign in with Google to save your progress.",
    public: true,
  },
];

const SECTION_BY_PATH = new Map(SECTIONS.map((s) => [s.path, s]));
const SECTION_BY_ID = new Map(SECTIONS.map((s) => [s.id, s]));

export function getSection(id) {
  return SECTION_BY_ID.get(id) || null;
}

export function pathFor(section, itemId = null) {
  const def = SECTION_BY_ID.get(section);
  if (!def) return "/overview";
  return itemId ? `/${def.path}/${encodeURIComponent(itemId)}` : `/${def.path}`;
}

export function routeFor(section, itemId = null, query = {}) {
  const def = SECTION_BY_ID.get(section) || SECTION_BY_ID.get("overview");
  const normalizedItem = itemId || null;
  return {
    section: def.id,
    itemId: normalizedItem,
    path: pathFor(def.id, normalizedItem),
    query: query || {},
  };
}

/** Path for the login screen, optionally remembering where the user wanted to go. */
export function loginPath(nextPath = null) {
  if (!nextPath || nextPath === "/overview") return "/login";
  return `/login?next=${encodeURIComponent(nextPath)}`;
}

export function hashForLogin(nextPath = null) {
  return `#${loginPath(nextPath)}`;
}

export function parseHash(hash = "") {
  const clean = String(hash || "")
    .replace(/^#/, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  if (!clean) return routeFor("overview");

  const [pathPart, queryPart = ""] = clean.split("?");
  const query = {};
  queryPart
    .split("&")
    .filter(Boolean)
    .forEach((pair) => {
      const [key, value = ""] = pair.split("=");
      try {
        query[decodeURIComponent(key)] = decodeURIComponent(value);
      } catch {
        query[key] = value;
      }
    });

  const segments = pathPart
    .split("/")
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    });

  const [first, ...rest] = segments;
  const def = SECTION_BY_PATH.get((first || "").toLowerCase());
  const itemId = rest.length ? rest.join("/") : null;

  if (!def) {
    return {
      section: "not-found",
      itemId: segments.join("/"),
      path: `/${segments.join("/")}`,
      query,
    };
  }

  return routeFor(def.id, itemId, query);
}

export function hashFor(section, itemId = null) {
  return `#${pathFor(section, itemId)}`;
}
