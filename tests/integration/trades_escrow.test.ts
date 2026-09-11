import { prisma } from "../../src/lib/prisma";
import { POST as createTrade } from "../../src/app/api/trades/route";
import { POST as settleQrHandover, GET as generateQrToken } from "../../src/app/api/trades/[id]/qr/route";
import { POST as sweepExpiredTrades } from "../../src/app/api/trades/expire/route";

/**
 * IT-ESC Suite: Escrow & QR Handover End-to-End Integration Verification
 * Traceability:
 * - Requirements: REQ-ESC-001, REQ-ESC-002, REQ-ESC-003, REQ-ESC-004, REQ-ESC-005, REQ-ESC-006
 * - Architecture: ARCH-ESC-001 (State Machine), ARCH-ESC-002 (QR Protocol)
 * - Detailed Design: SPEC-ESC-001, SPEC-ESC-002, SPEC-ESC-003, SPEC-ESC-004
 */
describe("Trades & Escrow Integration Suite (IT-ESC)", () => {
  let seller: any;
  let buyer: any;
  let intruder: any;
  let listing: any;

  beforeAll(async () => {
    // Setup isolated test entities with valid schema fields
    seller = await prisma.user.create({
      data: {
        joyIdAddress: `ckt1_it_seller_${Date.now()}`,
        displayName: "IT Test Seller",
        region: "UK",
      },
    });

    buyer = await prisma.user.create({
      data: {
        joyIdAddress: `ckt1_it_buyer_${Date.now()}`,
        displayName: "IT Test Buyer",
        region: "UK",
      },
    });

    intruder = await prisma.user.create({
      data: {
        joyIdAddress: `ckt1_it_intruder_${Date.now()}`,
        displayName: "IT Malicious Intruder",
        region: "UK",
      },
    });

    listing = await prisma.listing.create({
      data: {
        title: "IT Gundam Perfect Grade",
        description: "Integration test fixture for escrow handover",
        priceFiat: 250,
        currency: "GBP",
        condition: "LIKE_NEW",
        category: "ACTION_FIGURES",
        imageUrls: "[]",
        tradeMethod: "MEETUP",
        shippingRegion: "UK",
        sellerId: seller.id,
        status: "ACTIVE",
      },
    });
  });

  afterAll(async () => {
    if (listing?.id) {
      await prisma.passportLog.deleteMany({ where: { listingId: listing.id } }).catch(() => {});
      await prisma.trade.deleteMany({ where: { listingId: listing.id } }).catch(() => {});
      await prisma.listing.deleteMany({ where: { id: listing.id } }).catch(() => {});
    }
    if (seller?.id || buyer?.id || intruder?.id) {
      await prisma.user.deleteMany({
        where: { id: { in: [seller?.id, buyer?.id, intruder?.id].filter(Boolean) } },
      }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  test("[IT-ESC-001] Escrow Trade Initiation (REQ-ESC-001 / SPEC-ESC-001)", async () => {
    const req = new Request("http://localhost:3000/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: listing.id,
        buyerId: buyer.id,
        priceFiat: 250,
        priceCkb: "25000000000",
        exchangeRate: 0.02,
        method: "MEETUP",
      }),
    });

    const res = await createTrade(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.id).toBeDefined();
    expect(data.status).toBe("ESCROW_FUNDED");
    expect(data.buyerId).toBe(buyer.id);
    expect(data.sellerId).toBe(seller.id);

    // Clean up created trade and restore listing status to ACTIVE
    await prisma.trade.delete({ where: { id: data.id } });
    await prisma.listing.update({
      where: { id: listing.id },
      data: { status: "ACTIVE" },
    });
  });

  test("[IT-ESC-004] Self-Escrow Prevention (REQ-ESC-002 / SPEC-ESC-001)", async () => {
    const req = new Request("http://localhost:3000/api/trades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId: listing.id,
        buyerId: seller.id, // Seller attempting to buy own item
        priceFiat: 250,
        priceCkb: "25000000000",
        exchangeRate: 0.02,
        method: "MEETUP",
      }),
    });

    const res = await createTrade(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Sellers cannot initiate escrow trades on their own listings");
  });

  test("[IT-ESC-002] Ephemeral QR Token Generation (REQ-ESC-003 / SPEC-ESC-002)", async () => {
    const trade = await prisma.trade.create({
      data: {
        listingId: listing.id,
        sellerId: seller.id,
        buyerId: buyer.id,
        priceFiat: 250,
        priceCkb: BigInt("25000000000"),
        exchangeRate: 0.02,
        method: "MEETUP",
        status: "ESCROW_FUNDED",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const getReq = new Request(`http://localhost:3000/api/trades/${trade.id}/qr`);
    const res = await generateQrToken(getReq, { params: Promise.resolve({ id: trade.id }) });
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.token).toBeDefined();
    expect(data.token).toContain("QR_HANDOVER_");
    expect(data.expiresAt).toBeDefined();
    expect(new Date(data.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(data.sellerAddress).toBe(seller.joyIdAddress);
    expect(data.buyerAddress).toBe(buyer.joyIdAddress);

    await prisma.trade.delete({ where: { id: trade.id } });
  });

  test("[IT-ESC-003] In-Person QR Settlement & Handover (REQ-ESC-004 / SPEC-ESC-003)", async () => {
    const trade = await prisma.trade.create({
      data: {
        listingId: listing.id,
        sellerId: seller.id,
        buyerId: buyer.id,
        priceFiat: 250,
        priceCkb: BigInt("25000000000"),
        exchangeRate: 0.02,
        method: "MEETUP",
        status: "ESCROW_FUNDED",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 1. Seller generates token
    const getReq = new Request(`http://localhost:3000/api/trades/${trade.id}/qr`);
    const getRes = await generateQrToken(getReq, { params: Promise.resolve({ id: trade.id }) });
    const { token } = await getRes.json();

    // 2. Buyer submits valid token
    const postReq = new Request(`http://localhost:3000/api/trades/${trade.id}/qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        buyerAddress: buyer.joyIdAddress,
      }),
    });

    const postRes = await settleQrHandover(postReq, { params: Promise.resolve({ id: trade.id }) });
    expect(postRes.status).toBe(200);

    const postData = await postRes.json();
    expect(postData.success).toBe(true);

    // Verify DB side effects
    const updatedTrade = await prisma.trade.findUnique({ where: { id: trade.id } });
    expect(updatedTrade?.status).toBe("COMPLETED");

    const updatedListing = await prisma.listing.findUnique({ where: { id: listing.id } });
    expect(updatedListing?.status).toBe("TRADED");

    // Clean up
    await prisma.passportLog.deleteMany({ where: { listingId: listing.id } });
    await prisma.trade.delete({ where: { id: trade.id } });
  });

  test("[IT-ESC-004] Unauthorized Scanner Rejection (REQ-ESC-005 / SPEC-ESC-003)", async () => {
    const trade = await prisma.trade.create({
      data: {
        listingId: listing.id,
        sellerId: seller.id,
        buyerId: buyer.id,
        priceFiat: 250,
        priceCkb: BigInt("25000000000"),
        exchangeRate: 0.02,
        method: "MEETUP",
        status: "ESCROW_FUNDED",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const getReq = new Request(`http://localhost:3000/api/trades/${trade.id}/qr`);
    const getRes = await generateQrToken(getReq, { params: Promise.resolve({ id: trade.id }) });
    const { token } = await getRes.json();

    // Intruder attempts to claim
    const intruderReq = new Request(`http://localhost:3000/api/trades/${trade.id}/qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        buyerAddress: intruder.joyIdAddress,
      }),
    });

    const intruderRes = await settleQrHandover(intruderReq, { params: Promise.resolve({ id: trade.id }) });
    expect(intruderRes.status).toBe(403);
    const intruderData = await intruderRes.json();
    expect(intruderData.error).toContain("Caller address does not match the trade buyer");

    await prisma.trade.delete({ where: { id: trade.id } });
  });

  test("[IT-ESC-005] 7-Day Inactive Timeout Sweep (REQ-ESC-006 / SPEC-ESC-004)", async () => {
    const expiredListing = await prisma.listing.create({
      data: {
        title: "Vintage Mazinger Z (Expired Escrow)",
        description: "Timeout sweep test fixture",
        priceFiat: 400,
        currency: "GBP",
        condition: "GOOD",
        category: "ACTION_FIGURES",
        imageUrls: "[]",
        tradeMethod: "MEETUP",
        shippingRegion: "UK",
        sellerId: seller.id,
        status: "RESERVED",
      },
    });

    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    const expiredTrade = await prisma.trade.create({
      data: {
        listingId: expiredListing.id,
        sellerId: seller.id,
        buyerId: buyer.id,
        priceFiat: 400,
        priceCkb: BigInt("40000000000"),
        exchangeRate: 0.02,
        method: "MEETUP",
        status: "ESCROW_FUNDED",
        createdAt: eightDaysAgo,
        expiresAt: eightDaysAgo,
      },
    });

    // Run sweep
    const sweepRes = await sweepExpiredTrades();
    expect(sweepRes.status).toBe(200);
    const sweepData = await sweepRes.json();
    expect(sweepData.success).toBe(true);
    expect(sweepData.expiredCount).toBeGreaterThanOrEqual(1);

    // Verify status transitions
    const sweptTrade = await prisma.trade.findUnique({ where: { id: expiredTrade.id } });
    expect(sweptTrade?.status).toBe("EXPIRED");

    const sweptListing = await prisma.listing.findUnique({ where: { id: expiredListing.id } });
    expect(sweptListing?.status).toBe("ACTIVE");

    // Clean up
    await prisma.trade.delete({ where: { id: expiredTrade.id } });
    await prisma.listing.delete({ where: { id: expiredListing.id } });
  });
});
