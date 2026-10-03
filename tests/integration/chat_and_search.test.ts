import { prisma } from "../../src/lib/prisma";
import { GET as getListings } from "../../src/app/api/listings/route";
import { POST as createChatRoom, GET as getChatRooms } from "../../src/app/api/chat/rooms/route";
import { POST as postChatMessage, GET as getChatMessages } from "../../src/app/api/chat/rooms/[id]/messages/route";

describe("Chat & Search Integration Suite", () => {
  let seller: any;
  let buyer: any;
  let intruder: any;
  let listing1: any;
  let listing2: any;
  let chatRoomId: string;

  beforeAll(async () => {
    // Setup test users
    seller = await prisma.user.create({
      data: {
        joyIdAddress: `ckt1_test_chat_seller_${Date.now()}`,
        displayName: "Chat Test Seller",
        region: "UK",
      },
    });

    buyer = await prisma.user.create({
      data: {
        joyIdAddress: `ckt1_test_chat_buyer_${Date.now()}`,
        displayName: "Chat Test Buyer",
        region: "UK",
      },
    });

    intruder = await prisma.user.create({
      data: {
        joyIdAddress: `ckt1_test_chat_intruder_${Date.now()}`,
        displayName: "Chat Test Intruder",
        region: "VIETNAM",
      },
    });

    // Create test listings
    listing1 = await prisma.listing.create({
      data: {
        title: "Rare Vintage Millennium Falcon",
        description: "Star Wars classic LEGO set complete with figurines",
        priceFiat: 180,
        currency: "GBP",
        condition: "LIKE_NEW",
        category: "BUILDING_SETS",
        imageUrls: "[]",
        tradeMethod: "MEETUP",
        shippingRegion: "UK",
        sellerId: seller.id,
        status: "ACTIVE",
      },
    });

    listing2 = await prisma.listing.create({
      data: {
        title: "Wooden Montessori Puzzle",
        description: "Educational sensory puzzle for toddlers",
        priceFiat: 25,
        currency: "GBP",
        condition: "GOOD",
        category: "PUZZLES",
        imageUrls: "[]",
        tradeMethod: "SHIPPING",
        shippingRegion: "VIETNAM",
        sellerId: seller.id,
        status: "ACTIVE",
      },
    });
  });

  afterAll(async () => {
    // Teardown chat messages, rooms, listings, and test users
    if (chatRoomId) {
      await prisma.chatMessage.deleteMany({ where: { roomId: chatRoomId } }).catch(() => {});
      await prisma.chatRoom.deleteMany({ where: { id: chatRoomId } }).catch(() => {});
    }
    const listingIds = [listing1?.id, listing2?.id].filter(Boolean);
    if (listingIds.length > 0) {
      await prisma.chatMessage.deleteMany({ where: { room: { listingId: { in: listingIds } } } }).catch(() => {});
      await prisma.chatRoom.deleteMany({ where: { listingId: { in: listingIds } } }).catch(() => {});
      await prisma.listing.deleteMany({ where: { id: { in: listingIds } } }).catch(() => {});
    }
    const userIds = [seller?.id, buyer?.id, intruder?.id].filter(Boolean);
    if (userIds.length > 0) {
      await prisma.user.deleteMany({ where: { id: { in: userIds } } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  describe("Listings Search & Filtering", () => {
    test("filters listings by search query (title match)", async () => {
      const req = new Request("http://localhost:3000/api/listings?search=Millennium");
      const res = await getListings(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      const falcon = data.find((l: any) => l.id === listing1.id);
      expect(falcon).toBeDefined();
      expect(falcon.title).toContain("Millennium Falcon");

      const puzzle = data.find((l: any) => l.id === listing2.id);
      expect(puzzle).toBeUndefined();
    });

    test("filters listings by search query (description match)", async () => {
      const req = new Request("http://localhost:3000/api/listings?search=sensory");
      const res = await getListings(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      const puzzle = data.find((l: any) => l.id === listing2.id);
      expect(puzzle).toBeDefined();
    });

    test("filters listings by category", async () => {
      const req = new Request("http://localhost:3000/api/listings?category=BUILDING_SETS");
      const res = await getListings(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      const falcon = data.find((l: any) => l.id === listing1.id);
      expect(falcon).toBeDefined();

      const puzzle = data.find((l: any) => l.id === listing2.id);
      expect(puzzle).toBeUndefined();
    });

    test("filters listings by region", async () => {
      const req = new Request("http://localhost:3000/api/listings?region=VIETNAM");
      const res = await getListings(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      const puzzle = data.find((l: any) => l.id === listing2.id);
      expect(puzzle).toBeDefined();

      const falcon = data.find((l: any) => l.id === listing1.id);
      expect(falcon).toBeUndefined();
    });
  });

  describe("P2P Chat Rooms & Messaging", () => {
    test("creates or retrieves a chat room for buyer and seller", async () => {
      const req = new Request("http://localhost:3000/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing1.id,
          buyerId: buyer.id,
          sellerId: seller.id,
        }),
      });

      const res = await createChatRoom(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBeDefined();
      expect(data.listingId).toBe(listing1.id);
      expect(data.buyerId).toBe(buyer.id);
      expect(data.sellerId).toBe(seller.id);

      chatRoomId = data.id;
    });

    test("re-fetching the chat room returns the same room idempotently", async () => {
      const req = new Request("http://localhost:3000/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing1.id,
          buyerId: buyer.id,
          sellerId: seller.id,
        }),
      });

      const res = await createChatRoom(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.id).toBe(chatRoomId);
    });

    test("rejects chat room creation if buyer is the seller", async () => {
      const req = new Request("http://localhost:3000/api/chat/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing1.id,
          buyerId: seller.id,
          sellerId: seller.id,
        }),
      });

      const res = await createChatRoom(req);
      expect(res.status).toBe(400);
    });

    test("buyer can post a message to the chat room", async () => {
      const req = new Request(`http://localhost:3000/api/chat/rooms/${chatRoomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: buyer.id,
          content: "Hi, is the Millennium Falcon available for meetup this weekend?",
        }),
      });

      const res = await postChatMessage(req, { params: Promise.resolve({ id: chatRoomId }) });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.content).toBe("Hi, is the Millennium Falcon available for meetup this weekend?");
      expect(data.senderId).toBe(buyer.id);
    });

    test("seller can post a reply to the chat room", async () => {
      const req = new Request(`http://localhost:3000/api/chat/rooms/${chatRoomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: seller.id,
          content: "Yes, Saturday afternoon near Central Station works great!",
        }),
      });

      const res = await postChatMessage(req, { params: Promise.resolve({ id: chatRoomId }) });
      const data = await res.json();

      expect(res.status).toBe(201);
      expect(data.content).toBe("Yes, Saturday afternoon near Central Station works great!");
      expect(data.senderId).toBe(seller.id);
    });

    test("fetches all messages in chronological order", async () => {
      const req = new Request(`http://localhost:3000/api/chat/rooms/${chatRoomId}/messages`);
      const res = await getChatMessages(req, { params: Promise.resolve({ id: chatRoomId }) });
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBe(2);
      expect(data[0].senderId).toBe(buyer.id);
      expect(data[1].senderId).toBe(seller.id);
    });

    test("intruder cannot post message to an unauthorized room", async () => {
      const req = new Request(`http://localhost:3000/api/chat/rooms/${chatRoomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderId: intruder.id,
          content: "I am an unauthorized third party trying to inject a message.",
        }),
      });

      const res = await postChatMessage(req, { params: Promise.resolve({ id: chatRoomId }) });
      expect(res.status).toBe(403);
    });
  });
});
