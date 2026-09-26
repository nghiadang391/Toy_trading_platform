import { checkToySafety, checkToySafetyAsync } from "../src/lib/safety/recall-checker";

describe("Two-Tier Safety Recall Engine Tests", () => {
  test("[UT-REC-001] Tier 1: Instant local detection for critical known hazard patterns", () => {
    const res1 = checkToySafety("Fisher-Price Rock 'n Play Infant Sleeper");
    expect(res1.isRecalled).toBe(true);
    expect(res1.severity).toBe("HIGH");
    expect(res1.source).toBe("LOCAL_CATALOG");
    expect(res1.recallReason).toContain("Infant asphyxiation risk");

    const res2 = checkToySafety("Magnetix Magnetic Building Sphere Beads");
    expect(res2.isRecalled).toBe(true);
    expect(res2.severity).toBe("HIGH");
    expect(res2.source).toBe("LOCAL_CATALOG");
    expect(res2.recallReason).toContain("loose magnets");
  });

  test("[UT-REC-002] Tier 1: Clean check for benign popular toy models", () => {
    const res = checkToySafety("LEGO Star Wars Millennium Falcon 75192");
    expect(res.isRecalled).toBe(false);
    expect(res.severity).toBe("SAFE");
    expect(res.source).toBe("CLEAN");
    expect(res.recallReason).toBeNull();
  });

  test("[UT-REC-003] Tier 2: Asynchronous check queries CPSC and detects live recalled toy", async () => {
    const res = await checkToySafetyAsync("Fisher-Price Brunch & Go Stroller");
    expect(res.isRecalled).toBe(true);
    expect(res.severity).toBe("HIGH");
    expect(res.source).toBe("CPSC_GOV");
    expect(res.recallUrl).toBeDefined();
    expect(res.recallUrl?.startsWith("https://www.cpsc.gov")).toBe(true);
  }, 10000);

  test("[UT-REC-004] Tier 2: Asynchronous check confirms safe toy", async () => {
    const res = await checkToySafetyAsync("Custom Handmade Wooden Blocks Set 2026");
    expect(res.isRecalled).toBe(false);
    expect(res.severity).toBe("SAFE");
  }, 10000);

  test("[UT-REC-005] In-memory caching returns instant result on repeated query", async () => {
    const start1 = Date.now();
    await checkToySafetyAsync("LEGO Star Wars Millennium Falcon 75192");
    const dur1 = Date.now() - start1;

    const start2 = Date.now();
    const cached = await checkToySafetyAsync("LEGO Star Wars Millennium Falcon 75192");
    const dur2 = Date.now() - start2;

    expect(cached.isRecalled).toBe(false);
    expect(dur2).toBeLessThanOrEqual(dur1);
  });
});
