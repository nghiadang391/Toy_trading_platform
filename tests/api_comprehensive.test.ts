import { prisma } from "../src/lib/prisma";
import { POST as createListing, GET as getListings } from "../src/app/api/listings/route";
import { POST as createUser } from "../src/app/api/users/route";
import { POST as createTrade } from "../src/app/api/trades/route";
import { POST as processPayment } from "../src/app/api/fiber/pay/route";

describe("Comprehensive API & Edge Case Test Suite", () => {
  beforeAll(async () => {
    // Clear test records
    await prisma.passportLog.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.chatRoom.deleteMany();
    await prisma.trade.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Clean test records created during test runs so they do not persist
    await prisma.passportLog.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.chatMessage.deleteMany();
    await prisma.chatRoom.deleteMany();
    await prisma.trade.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("1. User API (/api/users)", () => {
    test("[IT-USR-001] Should create and register a new user with standard UK region", async () => {
      const req = new Request("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({
          joyIdAddress: "ckt1qdummyaddress1",
          displayName: "Alice UK",
          region: "UK",
        }),
      });

      const res = await createUser(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.displayName).toBe("Alice UK");
      expect(data.region).toBe("UK");
    });

    test("[IT-USR-002] Should defensively normalize 'VN' to 'VIETNAM' region", async () => {
      const req = new Request("http://localhost:3000/api/users", {
        method: "POST",
        body: JSON.stringify({
          joyIdAddress: "ckt1qdummyaddress2",
          displayName: "Bao Vietnam",
          region: "VN",
        }),
      });

      const res = await createUser(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.region).toBe("VIETNAM");
    });
  });

  describe("2. Listings API (/api/listings)", () => {
    test("[IT-LST-001] Should successfully create listing with Vietnamese region and VND currency", async () => {
      const req = new Request("http://localhost:3000/api/listings", {
        method: "POST",
        body: JSON.stringify({
          title: "Gao Ranger Robot",
          description: "Full combo Gao King",
          condition: "GOOD",
          category: "ACTION_FIGURES",
          priceFiat: 500000,
          currency: "VND",
          imageUrls: ["https://example.com/gao.jpg"],
          tradeMethod: "SHIPPING",
          shippingRegion: "VIETNAM",
          location: "District 1, HCMC",
          sellerId: "usr_dummy2",
          joyIdAddress: "ckt1qdummyaddress2",
          displayName: "Bao Vietnam",
          signature: "mock-sig-ckt1qdummyaddress2",
        }),
      });

      const res = await createListing(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.title).toBe("Gao Ranger Robot");
      expect(data.shippingRegion).toBe("VIETNAM");
      expect(data.currency).toBe("VND");
      expect(data.condition).toBe("GOOD");
    });

    test("[IT-LST-002] Should defensively normalize legacy 'USED' condition to 'GOOD' and 'VN' to 'VIETNAM'", async () => {
      const req = new Request("http://localhost:3000/api/listings", {
        method: "POST",
        body: JSON.stringify({
          title: "Devil Fruit Toy",
          description: "Old Luffy fruit",
          condition: "USED", // Legacy value from client cache
          category: "OTHER",
          priceFiat: 250000,
          currency: "VND",
          imageUrls: [],
          tradeMethod: "MEETUP",
          shippingRegion: "VN", // Legacy short code
          location: "Da Nang",
          sellerId: "usr_dummy2",
          joyIdAddress: "ckt1qdummyaddress2",
          displayName: "Bao Vietnam",
          signature: "mock-sig-ckt1qdummyaddress2",
        }),
      });

      const res = await createListing(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.condition).toBe("GOOD");
      expect(data.shippingRegion).toBe("VIETNAM");
    });

    test("[IT-LST-003] Should automatically upsert newly connected JoyID user when listing a toy", async () => {
      const newJoyId = "ckt1qfreshuserfrompasskey999";
      const req = new Request("http://localhost:3000/api/listings", {
        method: "POST",
        body: JSON.stringify({
          title: "LEGO Speed Champions",
          description: "Porsche 911 set",
          condition: "NEW",
          category: "VEHICLES",
          priceFiat: 45.0,
          currency: "GBP",
          imageUrls: [],
          tradeMethod: "BOTH",
          shippingRegion: "UK",
          location: "London",
          sellerId: "usr_fresh999",
          joyIdAddress: newJoyId,
          displayName: "Passkey User 999",
          signature: `mock-sig-${newJoyId}`,
        }),
      });

      const res = await createListing(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.title).toBe("LEGO Speed Champions");

      // Verify user was automatically created in DB
      const userInDb = await prisma.user.findUnique({
        where: { joyIdAddress: newJoyId },
      });
      expect(userInDb).not.toBeNull();
      expect(userInDb?.displayName).toBe("Passkey User 999");
    });

    test("[IT-LST-004] Should list all toys via GET /api/listings", async () => {
      const req = new Request("http://localhost:3000/api/listings");
      const res = await getListings(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("3. Trades & Escrow API (/api/trades & /api/fiber/pay)", () => {
    let buyerUser: any;
    let sellerUser: any;
    let createdListing: any;

    beforeAll(async () => {
      buyerUser = await prisma.user.create({
        data: {
          joyIdAddress: "ckt1qbuyeraddress123",
          displayName: "Buyer Charlie",
          region: "VIETNAM",
        },
      });

      createdListing = await prisma.listing.findFirst({
        where: { title: "Gao Ranger Robot" },
      });

      if (createdListing) {
        sellerUser = await prisma.user.findUnique({
          where: { id: createdListing.sellerId },
        });
      }
    });

    test("Should initiate a trade and lock listing status to RESERVED", async () => {
      const req = new Request("http://localhost:3000/api/trades", {
        method: "POST",
        body: JSON.stringify({
          listingId: createdListing.id,
          buyerId: buyerUser.id,
          method: "SHIPPING",
          priceFiat: 500000,
          priceCkb: "25000000000",
          exchangeRate: 0.02,
          escrowTxHash: "0xmockescrowtxhash123",
        }),
      });

      const res = await createTrade(req);
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.status).toBe("ESCROW_FUNDED");
      expect(data.priceCkb).toBe("25000000000");

      const listingStatus = await prisma.listing.findUnique({
        where: { id: createdListing.id },
      });
      expect(listingStatus?.status).toBe("RESERVED");
    });

    test("Should execute instant payment and transfer Toy Passport log to buyer", async () => {
      const trade = await prisma.trade.findFirst({
        where: { listingId: createdListing.id },
      });

      const req = new Request("http://localhost:3000/api/fiber/pay", {
        method: "POST",
        body: JSON.stringify({
          tradeId: trade?.id,
          invoice: "fbc1mockfiberinvoice123456789",
        }),
      });

      const res = await processPayment(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify listing marked TRADED
      const updatedListing = await prisma.listing.findUnique({
        where: { id: createdListing.id },
      });
      expect(updatedListing?.status).toBe("TRADED");

      // Verify Toy Passport ownership transfer log created
      const passportLog = await prisma.passportLog.findFirst({
        where: { listingId: createdListing.id },
      });
      expect(passportLog).not.toBeNull();
      expect(passportLog?.ownerAddress).toBe(buyerUser.joyIdAddress);
    });

    test("Security S3: Should reject self-trade when buyerId equals sellerId", async () => {
      // Create another active listing by Alice
      const selfListing = await prisma.listing.create({
        data: {
          title: "Self Trade Test Toy",
          description: "Test description",
          condition: "NEW",
          category: "PUZZLES",
          priceFiat: 100000,
          currency: "VND",
          imageUrls: "[]",
          tradeMethod: "MEETUP",
          shippingRegion: "VIETNAM",
          sellerId: sellerUser.id,
          status: "ACTIVE",
        },
      });

      const req = new Request("http://localhost:3000/api/trades", {
        method: "POST",
        body: JSON.stringify({
          listingId: selfListing.id,
          buyerId: sellerUser.id, // Same as sellerId!
          method: "MEETUP",
          priceFiat: 100000,
          priceCkb: "5000000000",
          exchangeRate: 0.02,
        }),
      });

      const res = await createTrade(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toContain("Sellers cannot initiate escrow trades on their own listings");
    });

    test("Security S2: Should reject QR settlement if caller address does not match seller", async () => {
      const { POST: settleQrHandover, GET: generateQrToken } = await import("../src/app/api/trades/[id]/qr/route");

      // Setup a fresh trade for QR testing
      const qrListing = await prisma.listing.create({
        data: {
          title: "QR Security Test Toy",
          description: "Testing QR seller verification",
          condition: "GOOD",
          category: "VEHICLES",
          priceFiat: 200000,
          currency: "VND",
          imageUrls: "[]",
          tradeMethod: "MEETUP",
          shippingRegion: "VIETNAM",
          sellerId: sellerUser.id,
          status: "ACTIVE",
        },
      });

      const qrTrade = await prisma.trade.create({
        data: {
          listingId: qrListing.id,
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          priceFiat: 200000,
          priceCkb: BigInt("10000000000"),
          exchangeRate: 0.02,
          method: "MEETUP",
          status: "ESCROW_FUNDED",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Generate dynamic QR token
      const getReq = new Request(`http://localhost:3000/api/trades/${qrTrade.id}/qr`);
      const tokenRes = await generateQrToken(getReq, { params: Promise.resolve({ id: qrTrade.id }) });
      const tokenData = await tokenRes.json();

      // Settle with attacker address (mismatched seller)
      const postReq = new Request(`http://localhost:3000/api/trades/${qrTrade.id}/qr`, {
        method: "POST",
        body: JSON.stringify({
          token: tokenData.token,
          sellerAddress: "0xattacker_fake_seller_address",
        }),
      });

      const settleRes = await settleQrHandover(postReq, { params: Promise.resolve({ id: qrTrade.id }) });
      const settleData = await settleRes.json();

      expect(settleRes.status).toBe(403);
      expect(settleData.error).toContain("Caller address does not match the listing seller");
    });

    test("Security S2b: Buyer QR approval should release escrow or reject mismatched buyer", async () => {
      const { POST: settleQrHandover, GET: generateQrToken } = await import("../src/app/api/trades/[id]/qr/route");

      const qrListing = await prisma.listing.create({
        data: {
          title: "Buyer Approval Test Toy",
          description: "Testing Buyer QR verification",
          condition: "GOOD",
          category: "PUZZLES",
          priceFiat: 150000,
          currency: "VND",
          imageUrls: "[]",
          tradeMethod: "MEETUP",
          shippingRegion: "VIETNAM",
          sellerId: sellerUser.id,
          status: "ACTIVE",
        },
      });

      const qrTrade = await prisma.trade.create({
        data: {
          listingId: qrListing.id,
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          priceFiat: 150000,
          priceCkb: BigInt("7500000000"),
          exchangeRate: 0.02,
          method: "MEETUP",
          status: "ESCROW_FUNDED",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      // Generate dynamic QR token from listingId
      const getReq = new Request(`http://localhost:3000/api/trades/${qrListing.id}/qr`);
      const tokenRes = await generateQrToken(getReq, { params: Promise.resolve({ id: qrListing.id }) });
      const tokenData = await tokenRes.json();
      expect(tokenRes.status).toBe(200);
      expect(tokenData.token).toBeDefined();

      // Attempt verification with unauthorized buyer caller
      const unauthorizedPost = new Request(`http://localhost:3000/api/trades/${qrTrade.id}/qr`, {
        method: "POST",
        body: JSON.stringify({
          token: tokenData.token,
          buyerAddress: "0xattacker_fake_buyer_address",
        }),
      });
      const unauthRes = await settleQrHandover(unauthorizedPost, { params: Promise.resolve({ id: qrTrade.id }) });
      const unauthData = await unauthRes.json();
      expect(unauthRes.status).toBe(403);
      expect(unauthData.error).toContain("Caller address does not match the trade buyer");

      // Legitimate buyer approves handover and releases escrow
      const legitimatePost = new Request(`http://localhost:3000/api/trades/${qrTrade.id}/qr`, {
        method: "POST",
        body: JSON.stringify({
          token: tokenData.token,
          buyerAddress: buyerUser.joyIdAddress,
        }),
      });
      const legitimateRes = await settleQrHandover(legitimatePost, { params: Promise.resolve({ id: qrTrade.id }) });
      const legitimateData = await legitimateRes.json();
      expect(legitimateRes.status).toBe(200);
      expect(legitimateData.success).toBe(true);
      expect(legitimateData.trade.status).toBe("COMPLETED");
    });

    test("Security S4: Should sweep and expire trades past their 7-day timeout", async () => {
      const { POST: sweepExpiredTrades } = await import("../src/app/api/trades/expire/route");

      // Create a stale expired trade (expiresAt in the past)
      const staleListing = await prisma.listing.create({
        data: {
          title: "Stale Escrow Toy",
          description: "Listing that was reserved but expired",
          condition: "GOOD",
          category: "OTHER",
          priceFiat: 300000,
          currency: "VND",
          imageUrls: "[]",
          tradeMethod: "MEETUP",
          shippingRegion: "VIETNAM",
          sellerId: sellerUser.id,
          status: "RESERVED",
        },
      });

      const pastDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000); // 8 days ago
      const staleTrade = await prisma.trade.create({
        data: {
          listingId: staleListing.id,
          buyerId: buyerUser.id,
          sellerId: sellerUser.id,
          priceFiat: 300000,
          priceCkb: BigInt("15000000000"),
          exchangeRate: 0.02,
          method: "MEETUP",
          status: "ESCROW_FUNDED",
          expiresAt: pastDate,
        },
      });

      // Run expiration sweep
      const sweepRes = await sweepExpiredTrades();
      const sweepData = await sweepRes.json();

      expect(sweepRes.status).toBe(200);
      expect(sweepData.success).toBe(true);
      expect(sweepData.expiredCount).toBeGreaterThanOrEqual(1);

      // Verify trade is now EXPIRED and listing is released back to ACTIVE
      const updatedStaleTrade = await prisma.trade.findUnique({ where: { id: staleTrade.id } });
      const updatedStaleListing = await prisma.listing.findUnique({ where: { id: staleListing.id } });

      expect(updatedStaleTrade?.status).toBe("EXPIRED");
      expect(updatedStaleListing?.status).toBe("ACTIVE");
    });
  });
});
