import { prisma } from "../../src/lib/prisma";
import { GET as getNotifications, PATCH as updateNotifications } from "../../src/app/api/notifications/route";
import { GET as getQrHandover, POST as verifyQrHandover } from "../../src/app/api/trades/[id]/qr/route";
import { GET as getListings, invalidateListingsCache } from "../../src/app/api/listings/route";
import { GET as getUserProfile } from "../../src/app/api/users/[id]/route";

describe("Marketplace Quality, Handover Role Separation, and Notification Suite", () => {
  let seller: any;
  let buyer: any;
  let activeListing: any;
  let tradedListing: any;
  let activeTrade: any;

  beforeAll(async () => {
    // Clean tables for isolated testing
    await prisma.notification.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.passportLog.deleteMany();
    await prisma.trade.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.user.deleteMany();

    // Create test seller and buyer
    seller = await prisma.user.create({
      data: {
        joyIdAddress: "ckt1q_test_seller_alice",
        displayName: "Seller Alice",
        region: "UK",
      },
    });

    buyer = await prisma.user.create({
      data: {
        joyIdAddress: "ckt1q_test_buyer_bob",
        displayName: "Buyer Bob",
        region: "UK",
      },
    });

    // Create Active listing
    activeListing = await prisma.listing.create({
      data: {
        title: "LEGO Star Wars X-Wing",
        description: "Complete set with box",
        condition: "LIKE_NEW",
        category: "BUILDING_SETS",
        priceFiat: 60,
        currency: "GBP",
        imageUrls: JSON.stringify(["https://example.com/xwing.jpg"]),
        tradeMethod: "MEETUP",
        shippingRegion: "UK",
        status: "ACTIVE",
        sellerId: seller.id,
      },
    });

    // Create Traded listing
    tradedListing = await prisma.listing.create({
      data: {
        title: "Vintage Teddy Bear",
        description: "Collectible teddy bear",
        condition: "GOOD",
        category: "OTHER",
        priceFiat: 25,
        currency: "GBP",
        imageUrls: JSON.stringify(["https://example.com/teddy.jpg"]),
        tradeMethod: "MEETUP",
        shippingRegion: "UK",
        status: "TRADED",
        sellerId: seller.id,
      },
    });

    // Create an active trade
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    activeTrade = await prisma.trade.create({
      data: {
        listingId: activeListing.id,
        buyerId: buyer.id,
        sellerId: seller.id,
        priceFiat: 60,
        priceCkb: 1000000000n,
        exchangeRate: 0.005,
        method: "MEETUP",
        status: "ESCROW_FUNDED",
        expiresAt,
      },
    });
  });

  afterAll(async () => {
    await prisma.notification.deleteMany();
    await prisma.rating.deleteMany();
    await prisma.passportLog.deleteMany();
    await prisma.trade.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.user.deleteMany();
  });

  // 1. Handover Role Separation Tests
  describe("Handover Role Separation & Token Masking", () => {
    it("Should provide the handover token to the seller", async () => {
      const req = new Request(
        `http://localhost:3000/api/trades/${activeTrade.id}/qr?callerAddress=${seller.joyIdAddress}`
      );
      const res = await getQrHandover(req, { params: Promise.resolve({ id: activeTrade.id }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(typeof data.token).toBe("string");
      expect(data.token.startsWith("QR_HANDOVER_")).toBe(true);
      expect(data.sellerAddress).toBe(seller.joyIdAddress);
    });

    it("Should MASK the handover token (return null) for the buyer", async () => {
      const req = new Request(
        `http://localhost:3000/api/trades/${activeTrade.id}/qr?callerAddress=${buyer.joyIdAddress}`
      );
      const res = await getQrHandover(req, { params: Promise.resolve({ id: activeTrade.id }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.token).toBeNull();
      expect(data.buyerAddress).toBe(buyer.joyIdAddress);
    });
  });

  // 2. Notifications System Tests
  describe("Notification System & Event Triggers", () => {
    it("Should create and fetch notifications for a user", async () => {
      // Seed a test notification for seller
      await prisma.notification.create({
        data: {
          userId: seller.id,
          type: "TRADE_BOOKED",
          title: "Toy Booked & Escrow Locked",
          message: "Buyer Bob reserved LEGO Star Wars X-Wing.",
          link: "/profile",
        },
      });

      const req = new Request(`http://localhost:3000/api/notifications?userId=${seller.id}`);
      const res = await getNotifications(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.unreadCount).toBeGreaterThanOrEqual(1);
      expect(data.notifications.length).toBeGreaterThanOrEqual(1);
      expect(data.notifications[0].title).toBe("Toy Booked & Escrow Locked");
    });

    it("Should mark notifications as read", async () => {
      const req = new Request("http://localhost:3000/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: seller.id, markAll: true }),
      });
      const res = await updateNotifications(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify unread count is now 0
      const getReq = new Request(`http://localhost:3000/api/notifications?userId=${seller.id}`);
      const getRes = await getNotifications(getReq);
      const getData = await getRes.json();
      expect(getData.unreadCount).toBe(0);
    });

    it("Should dispatch completion notifications to both parties upon QR verification", async () => {
      // First get active token from seller
      const qrReq = new Request(
        `http://localhost:3000/api/trades/${activeTrade.id}/qr?callerAddress=${seller.joyIdAddress}`
      );
      const qrRes = await getQrHandover(qrReq, { params: Promise.resolve({ id: activeTrade.id }) });
      const qrData = await qrRes.json();
      const token = qrData.token;

      // Buyer submits confirmation
      const postReq = new Request(`http://localhost:3000/api/trades/${activeTrade.id}/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          buyerAddress: buyer.joyIdAddress,
        }),
      });
      const postRes = await verifyQrHandover(postReq, { params: Promise.resolve({ id: activeTrade.id }) });
      const postData = await postRes.json();

      expect(postRes.status).toBe(200);
      expect(postData.success).toBe(true);

      // Verify both buyer and seller received completion notifications
      const buyerNotifs = await prisma.notification.findMany({
        where: { userId: buyer.id, type: "TRADE_COMPLETED" },
      });
      const sellerNotifs = await prisma.notification.findMany({
        where: { userId: seller.id, type: "TRADE_COMPLETED" },
      });

      expect(buyerNotifs.length).toBeGreaterThanOrEqual(1);
      expect(sellerNotifs.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 3. Marketplace Filtering & Performance
  describe("Marketplace Filtering & Performance", () => {
    it("Should exclude TRADED toys from default marketplace listings", async () => {
      invalidateListingsCache();

      const req = new Request("http://localhost:3000/api/listings");
      const res = await getListings(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);

      // Verify no listing has status TRADED
      const tradedItems = data.filter((item: any) => item.status === "TRADED");
      expect(tradedItems.length).toBe(0);
    });

    it("Should serve subsequent listing requests from cache in under 50ms", async () => {
      const req = new Request("http://localhost:3000/api/listings");

      // Prime cache
      await getListings(req);

      // Measure cached response time
      const t0 = Date.now();
      const cachedRes = await getListings(req);
      const elapsed = Date.now() - t0;

      expect(cachedRes.status).toBe(200);
      expect(cachedRes.headers.get("X-Cache")).toBe("HIT");
      expect(elapsed).toBeLessThan(50);
    });
  });

  // 4. User Profile API Tests
  describe("Comprehensive User Profile", () => {
    it("Should return profile with categorized open/sold listings and reputation", async () => {
      const req = new Request(`http://localhost:3000/api/users/${seller.id}`);
      const res = await getUserProfile(req, { params: Promise.resolve({ id: seller.id }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.displayName).toBe("Seller Alice");
      expect(data.joyIdAddress).toBe(seller.joyIdAddress);
      expect(Array.isArray(data.openListings)).toBe(true);
      expect(Array.isArray(data.soldListings)).toBe(true);
      expect(Array.isArray(data.reviews)).toBe(true);
      expect(typeof data.completedTradesCount).toBe("number");
    });

    it("Should support profile lookup by joyIdAddress", async () => {
      const req = new Request(`http://localhost:3000/api/users/${seller.joyIdAddress}`);
      const res = await getUserProfile(req, { params: Promise.resolve({ id: seller.joyIdAddress }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBe(seller.id);
    });
  });
});
