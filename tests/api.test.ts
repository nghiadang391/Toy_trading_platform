import { prisma } from "../src/lib/prisma";

describe("Backend API Data Integration Checks", () => {
  beforeAll(async () => {
    // Clear test records
    await prisma.rating.deleteMany();
    await prisma.trade.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("DB Models local read/write schema sanity", async () => {
    // Seed dummy user
    const user = await prisma.user.create({
      data: {
        joyIdAddress: "0xabc123dummyaddress",
        displayName: "Alice",
        region: "UK",
      },
    });
    expect(user.displayName).toBe("Alice");

    // Seed listing
    const listing = await prisma.listing.create({
      data: {
        title: "LEGO Star Wars",
        description: "New condition LEGO set",
        condition: "NEW",
        category: "BUILDING_SETS",
        priceFiat: 100.0,
        currency: "GBP",
        sellerId: user.id,
        tradeMethod: "MEETUP",
        status: "ACTIVE",
      },
    });
    expect(listing.title).toBe("LEGO Star Wars");
    expect(Number(listing.priceFiat)).toBe(100.0);
  });
});
