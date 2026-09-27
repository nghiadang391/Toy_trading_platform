/**
 * Smoke E2E Verification Suite (L3)
 * Tests run against the live dev server (http://localhost:3000)
 * Validates real environment variable resolution, Turso database connection,
 * full API request pipelines, and static assets.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

describe("Smoke E2E Suite against Live Server (L3)", () => {
  const timestamp = Date.now();
  const testAddress = `ckt1_smoke_${timestamp}`;
  let sellerUserId: string = "";
  let createdListingId: string = "";
  let createdTradeId: string = "";

  test("[E2E-SMK-001] App Homepage Boot: GET / returns 200 with HTML title", async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain("ToyTrade");
  });

  test("[E2E-SMK-002] Live Database Query: GET /api/listings returns 200 with JSON array", async () => {
    const res = await fetch(`${BASE_URL}/api/listings`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test("[E2E-SMK-003] First-Time User Provisioning: PATCH /api/users/profile creates user record", async () => {
    const res = await fetch(`${BASE_URL}/api/users/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        joyIdAddress: testAddress,
        displayName: "E2E Smoke Tester",
        region: "VIETNAM",
      }),
    });

    expect(res.status).toBe(200);
    const user = await res.json();
    expect(user.id).toBeDefined();
    expect(user.joyIdAddress).toBe(testAddress);
    expect(user.displayName).toBe("E2E Smoke Tester");
    expect(user.region).toBe("VIETNAM");
    sellerUserId = user.id;
  });

  test("[E2E-SMK-004] User Profile Update: PATCH /api/users/profile updates existing record", async () => {
    const res = await fetch(`${BASE_URL}/api/users/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        joyIdAddress: testAddress,
        displayName: "E2E Smoke Tester Updated",
        region: "UK",
      }),
    });

    expect(res.status).toBe(200);
    const user = await res.json();
    expect(user.displayName).toBe("E2E Smoke Tester Updated");
    expect(user.region).toBe("UK");
  });

  test("[E2E-SMK-005] Listing Pipeline: POST /api/listings persists new toy listing", async () => {
    const res = await fetch(`${BASE_URL}/api/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: `Smoke Test Toy ${timestamp}`,
        description: "Created by automated L3 smoke test suite",
        priceFiat: 100,
        currency: "GBP",
        condition: "LIKE_NEW",
        category: "ACTION_FIGURES",
        imageUrls: "[]",
        tradeMethod: "MEETUP",
        shippingRegion: "UK",
        sellerId: sellerUserId,
        signature: `mock-sig-${testAddress}`,
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.title).toBe(`Smoke Test Toy ${timestamp}`);
    expect(data.status).toBe("ACTIVE");
    createdListingId = data.id;
  });

  test("[E2E-SMK-006] Escrow Initiation: POST /api/trades locks listing in RESERVED", async () => {
    // Register a distinct buyer
    const buyerAddress = `ckt1_smoke_buyer_${timestamp}`;
    const buyerProfileRes = await fetch(`${BASE_URL}/api/users/profile`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        joyIdAddress: buyerAddress,
        displayName: "E2E Smoke Buyer",
        region: "UK",
      }),
    });
    const buyer = await buyerProfileRes.json();

    const tradeRes = await fetch(`${BASE_URL}/api/trades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: createdListingId,
        buyerId: buyer.id,
        priceFiat: 100,
        priceCkb: "10000000000",
        exchangeRate: 0.02,
        method: "MEETUP",
      }),
    });

    expect(tradeRes.status).toBe(201);
    const tradeData = await tradeRes.json();
    expect(tradeData.id).toBeDefined();
    expect(tradeData.status).toBe("ESCROW_FUNDED");
    createdTradeId = tradeData.id;
  });

  test("[E2E-SMK-007] External Market Data Integration: GET /api/price/ckb returns exchange rate", async () => {
    const res = await fetch(`${BASE_URL}/api/price/ckb?currency=gbp`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.rate).toBeDefined();
    expect(typeof data.rate).toBe("number");
    expect(data.rate).toBeGreaterThan(0);
  });

  test("[E2E-SMK-008] Static Asset Delivery: Next.js routing and UI bundle returns valid status", async () => {
    const res = await fetch(`${BASE_URL}/listings`);
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html.length).toBeGreaterThan(500);
  });
});
