// Content service — syncs hardcoded content to Firestore and reads it back.
//
// Note on Firestore limits this solves for:
//   - No nested arrays (arrays-of-arrays are not allowed in documents)
//   - No undefined values
//   - 1MB document size limit
//   - No Function / Symbol / Map / Set values
//
// Solution: serialize each item to a JSON string stored in a single field.
// On fetch, deserialize. This sidesteps all Firestore data-shape limitations.

import {
  doc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase";

import { ALL_DSA } from "../data/dsa";
import { SYSTEM_DESIGN } from "../data/systemDesign";
import { MACHINE_CODING } from "../data/machineCoding";
import { JS_PROBLEMS } from "../data/jsProblems";
import {
  CONCEPTS_COMMON,
  CONCEPTS_FE,
  CONCEPTS_BE,
  CONCEPTS_ARCHITECTURE,
} from "../data/concepts";
import { FE_PLAN, BE_PLAN } from "../data/plans";
import { FE_PLAN_DETAIL, BE_PLAN_DETAIL } from "../data/plans-detail";
import { BEHAVIORAL_PROMPTS } from "../data/behavioral";
import { RESOURCES } from "../data/resources";

// ─── Sanitize for Firestore ─────────────────────────────
// Drop functions, symbols, undefined. JSON will handle the rest.
function sanitize(item) {
  try {
    return JSON.parse(JSON.stringify(item, (_, v) => {
      if (typeof v === "function") return undefined;
      if (typeof v === "symbol") return undefined;
      if (v === undefined) return null;
      return v;
    }));
  } catch (e) {
    console.warn("Sanitize failed for item:", item?.id, e);
    return null;
  }
}

// ─── Seed content to Firestore (admin action) ────────────
async function seedCollection(kind, items) {
  const chunks = [];
  // Smaller batch size (100) to stay well under the 500 op / 10MB total limits
  for (let i = 0; i < items.length; i += 100) chunks.push(items.slice(i, i + 100));

  let written = 0;
  let failed = 0;
  const errors = [];

  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    const batch = writeBatch(db);
    let batchOps = 0;

    for (const item of chunk) {
      if (!item?.id) { failed++; continue; }
      const safe = sanitize(item);
      if (!safe) { failed++; continue; }

      // Store as JSON string to sidestep nested-array / undefined issues
      const payload = {
        id: item.id,
        json: JSON.stringify(safe),
        _seededAt: serverTimestamp(),
      };
      const ref = doc(db, "content", kind, "items", item.id);
      batch.set(ref, payload);
      batchOps++;
    }

    if (batchOps === 0) continue;
    try {
      await batch.commit();
      written += batchOps;
    } catch (e) {
      failed += batchOps;
      errors.push({ kind, chunk: ci, error: e.message || String(e) });
      // Throw on first failure so user sees the actual error
      throw new Error(`[${kind}] batch ${ci} failed: ${e.message || e}`);
    }
  }

  if (errors.length > 0) console.warn(`Seed ${kind} had errors:`, errors);
  return { written, failed };
}

export async function seedAllContent(onProgress) {
  const result = {
    dsa: 0, sd: 0, mc: 0, js: 0, concepts: 0, plans: 0, behavioral: 0, resources: 0,
    failures: {},
    error: null,
  };
  const log = (msg) => { if (onProgress) onProgress(msg); };

  try {
    log("Seeding DSA...");
    const r1 = await seedCollection("dsa", ALL_DSA);
    result.dsa = r1.written; if (r1.failed) result.failures.dsa = r1.failed;

    log("Seeding System Design...");
    const r2 = await seedCollection("systemDesign", SYSTEM_DESIGN);
    result.sd = r2.written;

    log("Seeding Machine Coding...");
    const r3 = await seedCollection("machineCoding", MACHINE_CODING);
    result.mc = r3.written;

    log("Seeding JS Problems...");
    const r4 = await seedCollection("jsProblems", JS_PROBLEMS);
    result.js = r4.written;

    log("Seeding Concepts...");
    const allConcepts = [
      ...CONCEPTS_COMMON.map((c) => ({ ...c, group: "common" })),
      ...CONCEPTS_FE.map((c) => ({ ...c, group: "fe" })),
      ...CONCEPTS_BE.map((c) => ({ ...c, group: "be" })),
      ...CONCEPTS_ARCHITECTURE.map((c) => ({ ...c, group: "architecture" })),
    ];
    const r5 = await seedCollection("concepts", allConcepts);
    result.concepts = r5.written;

    log("Seeding 30-Day Plans...");
    const planItems = [
      ...FE_PLAN.map((day) => ({
        ...day, id: `fe-${day.d}`, track: "fe",
        detail: FE_PLAN_DETAIL[day.d] || null,
      })),
      ...BE_PLAN.map((day) => ({
        ...day, id: `be-${day.d}`, track: "be",
        detail: BE_PLAN_DETAIL[day.d] || null,
      })),
    ];
    const r6 = await seedCollection("plans", planItems);
    result.plans = r6.written;

    log("Seeding Behavioral...");
    const r7 = await seedCollection("behavioral", BEHAVIORAL_PROMPTS);
    result.behavioral = r7.written;

    log("Seeding Resources...");
    const resourceItems = RESOURCES.map((r, i) => ({ ...r, id: `res-${i}` }));
    const r8 = await seedCollection("resources", resourceItems);
    result.resources = r8.written;

    log("Done.");
  } catch (e) {
    result.error = e.message || String(e);
    throw e; // re-throw so UI shows the error
  }

  return result;
}

// ─── Fetch overrides from Firestore ──────────────────────
export async function fetchContent(kind) {
  try {
    const snap = await getDocs(collection(db, "content", kind, "items"));
    const map = {};
    snap.forEach((d) => {
      const data = d.data();
      if (data?.json) {
        try { map[d.id] = JSON.parse(data.json); }
        catch { /* ignore parse errors */ }
      } else {
        // Legacy: plain doc not using json field
        map[d.id] = data;
      }
    });
    return map;
  } catch (e) {
    console.warn(`fetchContent(${kind}) failed:`, e);
    return {};
  }
}

// Merge Firestore overrides into a hardcoded list.
export function mergeWithOverrides(hardcoded, overrides) {
  const overrideMap = overrides || {};
  const usedIds = new Set();

  const merged = hardcoded.map((item) => {
    if (overrideMap[item.id]) {
      usedIds.add(item.id);
      return { ...item, ...overrideMap[item.id] };
    }
    return item;
  });

  Object.entries(overrideMap).forEach(([id, item]) => {
    if (!usedIds.has(id)) merged.push({ ...item, id });
  });

  return merged;
}

export async function fetchMerged(kind, hardcoded) {
  const overrides = await fetchContent(kind);
  return mergeWithOverrides(hardcoded, overrides);
}
