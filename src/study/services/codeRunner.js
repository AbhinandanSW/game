// Run JavaScript code with test cases. Returns { passed, results: [{ pass, input, expected, actual, error }] }

function deepEqual(a, b) {
  if (a === b) return true;
  if (Number.isNaN(a) && Number.isNaN(b)) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => deepEqual(a[k], b[k]));
  }
  return false;
}

// Normalize for "set" comparison (3Sum)
function normalizeSet(arr) {
  return JSON.stringify(
    arr
      .map((inner) => (Array.isArray(inner) ? [...inner].sort((a, b) => a - b) : inner))
      .slice()
      .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
  );
}

// Normalize for "grouped" comparison (Group Anagrams)
function normalizeGrouped(arr) {
  return JSON.stringify(
    arr.map((g) => [...g].sort()).sort((a, b) => a[0]?.localeCompare(b[0] || ""))
  );
}

function compare(expected, actual, cmp) {
  if (cmp === "set") return normalizeSet(expected) === normalizeSet(actual);
  if (cmp === "grouped") return normalizeGrouped(expected) === normalizeGrouped(actual);
  return deepEqual(expected, actual);
}

export function runJavaScript(code, testCases, fnName) {
  if (!testCases || testCases.length === 0) {
    return { ok: false, message: "No test cases for this problem. Code saved." };
  }

  const results = [];
  let fn;

  // Create sandboxed function from user code
  try {
    const wrapped = `${code}\n; return typeof ${fnName} !== "undefined" ? ${fnName} : null;`;
    // eslint-disable-next-line no-new-func
    fn = new Function(wrapped)();
    if (typeof fn !== "function") {
      return { ok: false, message: `Function "${fnName}" not found. Please define it.` };
    }
  } catch (e) {
    return { ok: false, message: "Syntax error: " + e.message };
  }

  let allPass = true;
  for (const tc of testCases) {
    try {
      // Deep clone args to prevent mutation between tests
      const args = JSON.parse(JSON.stringify(tc.args));
      const startTime = performance.now();
      const actual = fn(...args);
      const elapsed = performance.now() - startTime;
      const pass = compare(tc.expected, actual, tc.cmp);
      if (!pass) allPass = false;
      results.push({
        pass,
        input: JSON.stringify(tc.args),
        expected: JSON.stringify(tc.expected),
        actual: JSON.stringify(actual),
        time: elapsed.toFixed(2) + "ms",
      });
    } catch (e) {
      allPass = false;
      results.push({
        pass: false,
        input: JSON.stringify(tc.args),
        expected: JSON.stringify(tc.expected),
        actual: null,
        error: e.message,
      });
    }
  }

  return { ok: true, allPass, results };
}

// For non-JS languages, just run basic syntax check (placeholder)
export function runOtherLanguage(code, lang) {
  return {
    ok: false,
    message: `${lang.charAt(0).toUpperCase() + lang.slice(1)} execution requires a backend service (e.g., Judge0). Your code has been saved to your progress. Test it in your local IDE.`,
  };
}
