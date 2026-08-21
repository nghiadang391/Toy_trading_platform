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
    test("Should create and register a new user with standard UK region", async () => {
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

    test("Should defensively normalize 'VN' to 'VIETNAM' region", async () => {
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
    test("Should successfully create listing with Vietnamese region and VND currency", async () => {
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

    test("Should defensively normalize legacy 'USED' condition to 'GOOD' and 'VN' to 'VIETNAM'", async () => {
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

    test("Should automatically upsert newly connected JoyID user when listing a toy", async () => {
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

    test("Should list all toys via GET /api/listings", async () => {
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
  });
});
