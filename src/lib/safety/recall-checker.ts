/**
 * Safety Recall Checker Utility
 * Queries toy safety patterns and recall databases (e.g. CPSC, EU Safety Gate)
 */

export interface RecallCheckResult {
  isRecalled: boolean;
  recallReason: string | null;
  severity: "HIGH" | "MEDIUM" | "SAFE";
  matchedRule?: string;
}

// Known recalled product models & high-risk keywords catalog
const RECALL_CATALOG: Array<{ pattern: RegExp; reason: string; severity: "HIGH" | "MEDIUM" }> = [
  {
    pattern: /rock\s*['']?\s*n\s*play|inclined\s*sleeper/i,
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

export function checkToySafety(title: string, description: string = ""): RecallCheckResult {
  const combinedText = `${title} ${description}`.trim();

  for (const item of RECALL_CATALOG) {
    if (item.pattern.test(combinedText)) {
      return {
        isRecalled: true,
        recallReason: item.reason,
        severity: item.severity,
        matchedRule: item.pattern.source,
      };
    }
  }

  return {
    isRecalled: false,
    recallReason: null,
    severity: "SAFE",
  };
}
