/**
 * Safety Recall Checker Utility
 * Two-tier hybrid safety engine:
 * Tier 1: Instant local in-memory catalog for known high-severity hazards
 * Tier 2: Real-time queries to official US Consumer Product Safety Commission (CPSC / SaferProducts.gov) REST API
 */

export interface RecallCheckResult {
  isRecalled: boolean;
  recallReason: string | null;
  severity: "HIGH" | "MEDIUM" | "SAFE";
  matchedRule?: string;
  recallUrl?: string | null;
  recallDate?: string | null;
  hazard?: string | null;
  source: "LOCAL_CATALOG" | "CPSC_GOV" | "CLEAN";
}

// Known recalled product models & high-risk keywords catalog (Tier 1)
const RECALL_CATALOG: Array<{ pattern: RegExp; reason: string; severity: "HIGH" | "MEDIUM" }> = [
  {
    pattern: /rock\s*[\x27\x22\u2019]?\s*n\s*play|inclined\s*sleeper/i,
    reason: "Official Recall Alert (2019/2023): Infant asphyxiation risk associated with inclined sleep products.",
    severity: "HIGH",
  },
  {
    pattern: /magnetix|magnetic\s*building\s*(sphere|beads|balls)|neocube/i,
    reason: "Official Recall Alert: High-powered loose magnets pose severe internal perforation risks if swallowed.",
    severity: "HIGH",
  },
  {
    pattern: /drop\s*side\s*crib/i,
    reason: "Official Safety Hazard: Drop-side crib hardware failure and entrapment risk.",
    severity: "HIGH",
  },
  {
    pattern: /aqua\s*dots|bindeez/i,
    reason: "Official Recall Alert: Chemical toxicity hazard from toxic coating on craft beads.",
    severity: "HIGH",
  },
  {
    pattern: /water\s*beads.*(toddler|infant|baby)/i,
    reason: "Safety Hazard Warning: Expanding water beads pose internal blockage risk for young children under 3.",
    severity: "MEDIUM",
  },
];

// In-memory LRU-like cache (24 hours TTL)
interface CacheEntry {
  result: RecallCheckResult;
  timestamp: number;
}
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const recallCache = new Map<string, CacheEntry>();

/**
 * Synchronous Tier 1 Check against local hazard catalog
 */
export function checkToySafety(title: string, description: string = ""): RecallCheckResult {
  const combinedText = `${title} ${description}`.trim();

  for (const item of RECALL_CATALOG) {
    if (item.pattern.test(combinedText)) {
      return {
        isRecalled: true,
        recallReason: item.reason,
        severity: item.severity,
        matchedRule: item.pattern.source,
        source: "LOCAL_CATALOG",
      };
    }
  }

  return {
    isRecalled: false,
    recallReason: null,
    severity: "SAFE",
    source: "CLEAN",
  };
}

/**
 * Query official US CPSC / SaferProducts.gov REST API
 */
async function queryCpscRecalls(query: string, timeoutMs: number = 3000): Promise<RecallCheckResult | null> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 3) return null;

  // Extract candidate search terms
  const rawWords = trimmed.split(/[\s,-]+/).filter(w => w.length > 1);
  const words = rawWords.map(w => w.toLowerCase());
  const genericWords = new Set(["toy", "toys", "vintage", "figure", "figures", "custom", "set", "wars", "star", "lego", "mattel", "hasbro"]);
  const productSpecificWords = words.filter(w => w.length >= 4 && !genericWords.has(w));

  const candidateTerms: string[] = [trimmed];
  if (productSpecificWords.length >= 2) {
    candidateTerms.push(productSpecificWords.slice(0, 2).join(" "));
  } else if (words.length >= 3) {
    candidateTerms.push(words.slice(1, 3).join(" "));
  }

  for (const term of candidateTerms) {
    if (!term || term.trim().length < 4) continue;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallTitle=${encodeURIComponent(term)}`;
      const res = await fetch(url, {
        method: "GET",
        headers: { "Accept": "application/json" },
        signal: controller.signal,
      });

      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Strictly match against product-specific keywords
          const matched = data.find((r: any) => {
            const rTitle = (r.Title || "").toLowerCase();
            const rProducts = Array.isArray(r.Products)
              ? r.Products.map((p: any) => `${p.Name || ""} ${p.Model || ""}`.toLowerCase()).join(" ")
              : "";
            const combinedTarget = `${rTitle} ${rProducts}`;

            // If product has specific words (e.g. "brunch", "stroller"), they must match
            if (productSpecificWords.length > 0) {
              const specificMatches = productSpecificWords.filter(w => combinedTarget.includes(w)).length;
              return specificMatches >= Math.min(2, productSpecificWords.length);
            }

            const generalMatches = words.filter(w => w.length >= 4 && combinedTarget.includes(w)).length;
            return generalMatches >= Math.min(3, words.length);
          });

          if (!matched) {
            continue;
          }

          const hazardText = matched.Hazards && matched.Hazards.length > 0 ? matched.Hazards[0].Name : null;
          const recallReason = hazardText 
            ? `Official CPSC Recall: ${hazardText}`
            : `Official CPSC Recall: ${matched.Title}`;

          clearTimeout(timer);
          return {
            isRecalled: true,
            recallReason,
            severity: "HIGH",
            recallUrl: matched.URL || null,
            recallDate: matched.RecallDate || null,
            hazard: hazardText || matched.Title || null,
            source: "CPSC_GOV",
          };
        }
      }
    } catch {
      // Proceed to next candidate or fall back
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}

/**
 * Two-tier Asynchronous Safety Check:
 * 1. Immediate local catalog check
 * 2. In-memory cache inspection
 * 3. Live US CPSC REST API check
 */
export async function checkToySafetyAsync(
  title: string,
  description: string = ""
): Promise<RecallCheckResult> {
  // 1. Tier 1: Local catalog check
  const localResult = checkToySafety(title, description);
  if (localResult.isRecalled) {
    return localResult;
  }

  // Generate cache key
  const cacheKey = title.trim().toLowerCase();
  const cached = recallCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  // 2. Tier 2: Live CPSC query
  const cpscResult = await queryCpscRecalls(title);
  const finalResult: RecallCheckResult = cpscResult || localResult;

  // Cache result
  recallCache.set(cacheKey, {
    result: finalResult,
    timestamp: Date.now(),
  });

  return finalResult;
}
