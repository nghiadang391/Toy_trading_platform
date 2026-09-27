import { prisma } from "../../src/lib/prisma";
import { PATCH as updateProfile } from "../../src/app/api/users/profile/route";
import { GET as getListings } from "../../src/app/api/listings/route";
import { POST as rateTrade, GET as getTradeRatings } from "../../src/app/api/trades/[id]/rate/route";

describe("User Profile & Trade Mutual Ratings Integration Suite", () => {
  let userA: any;
  let userB: any;
  let userC: any;
  let listing1: any;
  let completedTrade: any;
  let pendingTrade: any;

  beforeAll(async () => {
    // Clean tables
    await prisma.rating.deleteMany();
    await prisma.trade.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    userA = await prisma.user.create({
      data: {
        joyIdAddress: "ckt1q_profile_seller_alice",
        displayName: "Passkey User lice",
        region: "UK",
      },
    });

    userB = await prisma.user.create({
      data: {
        joyIdAddress: "ckt1q_profile_buyer_bob",
        displayName: "Passkey User bbob",
        region: "VIETNAM",
      },
    });

    userC = await prisma.user.create({
      data: {
        joyIdAddress: "ckt1q_profile_stranger_charlie",
        displayName: "Passkey User rlie",
        region: "UK",
      },
    });

    // Create listing for User A
    listing1 = await prisma.listing.create({
      data: {
        title: "Collector Gundam RG",
        description: "Bandai 1/144 RG Real Grade Gundam",
        condition: "LIKE_NEW",
        category: "ACTION_FIGURES",
        priceFiat: 45,
        currency: "GBP",
        imageUrls: JSON.stringify(["https://example.com/gundam.jpg"]),
        tradeMethod: "BOTH",
        shippingRegion: "UK",
        location: "London",
        status: "TRADED",
        sellerId: userA.id,
      },
    });

    // Completed trade between Bob (buyer) and Alice (seller)
    completedTrade = await prisma.trade.create({
      data: {
        listingId: listing1.id,
        buyerId: userB.id,
        sellerId: userA.id,
        priceFiat: 45,
        priceCkb: BigInt(4500),
        exchangeRate: 100,
        method: "MEETUP",
        status: "COMPLETED",
        buyerConfirmed: true,
        sellerConfirmed: true,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });

    // Active/Pending trade that is NOT completed
    pendingTrade = await prisma.trade.create({
      data: {
        listingId: listing1.id,
        buyerId: userB.id,
        sellerId: userA.id,
        priceFiat: 45,
        priceCkb: BigInt(4500),
        exchangeRate: 100,
        method: "MEETUP",
        status: "ESCROW_FUNDED",
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
  });

  afterAll(async () => {
    await prisma.rating.deleteMany();
    await prisma.trade.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("1. Profile Customization (PATCH /api/users/profile)", () => {
    test("[IT-USR-003] Should successfully update user display name and region", async () => {
      const req = new Request("http://localhost:3000/api/users/profile", {
        method: "PATCH",
        body: JSON.stringify({
          joyIdAddress: userA.joyIdAddress,
          displayName: "Alice Toy Boutique",
          region: "VIETNAM",
        }),
      });

      const res = await updateProfile(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.displayName).toBe("Alice Toy Boutique");
      expect(data.region).toBe("VIETNAM");

      const dbUser = await prisma.user.findUnique({
        where: { joyIdAddress: userA.joyIdAddress },
      });
      expect(dbUser?.displayName).toBe("Alice Toy Boutique");
    });

    test("[IT-USR-004] Should reject blank or excessively short display names", async () => {
      const req = new Request("http://localhost:3000/api/users/profile", {
        method: "PATCH",
        body: JSON.stringify({
          joyIdAddress: userA.joyIdAddress,
          displayName: " ",
        }),
      });

      const res = await updateProfile(req);
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toMatch(/must be at least 2 characters/i);
    });

    test("[IT-USR-005] Should upsert and provision profile if user connects wallet for first time", async () => {
      const req = new Request("http://localhost:3000/api/users/profile", {
        method: "PATCH",
        body: JSON.stringify({
          joyIdAddress: "ckt1q_first_time_connect_wallet",
          displayName: "Ghost Rider",
          region: "UK",
        }),
      });

      const res = await updateProfile(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.displayName).toBe("Ghost Rider");
      expect(data.joyIdAddress).toBe("ckt1q_first_time_connect_wallet");

      const created = await prisma.user.findUnique({
        where: { joyIdAddress: "ckt1q_first_time_connect_wallet" },
      });
      expect(created?.displayName).toBe("Ghost Rider");
    });
  });

  describe("2. Mutual Trade Ratings (POST /api/trades/[id]/rate)", () => {
    test("[IT-RAT-001] Buyer should successfully rate seller with 5 stars and comments", async () => {
      const req = new Request(`http://localhost:3000/api/trades/${completedTrade.id}/rate`, {
        method: "POST",
        body: JSON.stringify({
          callerAddress: userB.joyIdAddress,
          score: 5,
          comment: "Gundam in perfect condition, prompt handover!",
        }),
      });

      const res = await rateTrade(req, { params: Promise.resolve({ id: completedTrade.id }) });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.score).toBe(5);
      expect(data.raterId).toBe(userB.id);
      expect(data.ratedUserId).toBe(userA.id);
      expect(data.comment).toBe("Gundam in perfect condition, prompt handover!");
    });

    test("[IT-RAT-002] Seller should also be able to rate buyer for the same trade (bidirectional)", async () => {
      const req = new Request(`http://localhost:3000/api/trades/${completedTrade.id}/rate`, {
        method: "POST",
        body: JSON.stringify({
          callerAddress: userA.joyIdAddress,
          score: 5,
          comment: "Great buyer, very polite and on time.",
        }),
      });

      const res = await rateTrade(req, { params: Promise.resolve({ id: completedTrade.id }) });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.score).toBe(5);
      expect(data.raterId).toBe(userA.id);
      expect(data.ratedUserId).toBe(userB.id);
    });

    test("[IT-RAT-003] Duplicate rating from same user on same trade must be rejected", async () => {
      const req = new Request(`http://localhost:3000/api/trades/${completedTrade.id}/rate`, {
        method: "POST",
        body: JSON.stringify({
          callerAddress: userB.joyIdAddress,
          score: 4,
          comment: "Trying to submit again",
        }),
      });

      const res = await rateTrade(req, { params: Promise.resolve({ id: completedTrade.id }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toMatch(/already submitted a rating/i);
    });

    test("[IT-RAT-004] Unauthorized third party cannot rate a trade they are not part of", async () => {
      const req = new Request(`http://localhost:3000/api/trades/${completedTrade.id}/rate`, {
        method: "POST",
        body: JSON.stringify({
          callerAddress: userC.joyIdAddress,
          score: 1,
          comment: "Malicious spam rating",
        }),
      });

      const res = await rateTrade(req, { params: Promise.resolve({ id: completedTrade.id }) });
      const data = await res.json();

      expect(res.status).toBe(403);
      expect(data.error).toMatch(/neither buyer nor seller/i);
    });

    test("[IT-RAT-005] Rating an incomplete (PENDING / ESCROW_FUNDED) trade must be rejected", async () => {
      const req = new Request(`http://localhost:3000/api/trades/${pendingTrade.id}/rate`, {
        method: "POST",
        body: JSON.stringify({
          callerAddress: userB.joyIdAddress,
          score: 5,
        }),
      });

      const res = await rateTrade(req, { params: Promise.resolve({ id: pendingTrade.id }) });
      const data = await res.json();

      expect(res.status).toBe(400);
      expect(data.error).toMatch(/only be submitted for COMPLETED trades/i);
    });

    test("[IT-RAT-006] Should retrieve trade ratings via GET /api/trades/[id]/rate", async () => {
      const req = new Request(`http://localhost:3000/api/trades/${completedTrade.id}/rate`, {
        method: "GET",
      });

      const res = await getTradeRatings(req, { params: Promise.resolve({ id: completedTrade.id }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.ratings).toHaveLength(2);
    });
  });

  describe("3. Reputation Aggregation in Listings (GET /api/listings)", () => {
    test("[IT-LST-006] Should aggregate seller rating, review count, and completed trades", async () => {
      const req = new Request("http://localhost:3000/api/listings?status=TRADED");
      const res = await getListings(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      const target = data.find((l: any) => l.id === listing1.id);
      expect(target).toBeDefined();
      expect(target.seller.displayName).toBe("Alice Toy Boutique");
      expect(target.seller.rating).toBe(5);
      expect(target.seller.reviewCount).toBe(1);
      expect(target.seller.completedTrades).toBe(1);
    });
  });
});
