import {
  prepareMintToyPassport,
  prepareTransferToyPassport,
  executeMintToyPassport,
  executeTransferToyPassport,
} from "../src/lib/ckb/spore";
import { prisma } from "../src/lib/prisma";
import { POST as completeQrHandover } from "../src/app/api/trades/[id]/qr/route";
import { GET as getPassport } from "../src/app/api/passport/[id]/route";

describe("Toy Passport Spore DOB Transaction Builder and Execution Checks", () => {
  const dummySeller = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvarm0tahu0qfkq6ktuf3wd8azaas0h24c9myfz6";
  const dummyBuyer = "ckt1qzda0cr08m85hc8jlnfp3zer7xulejywt49kt2rr0vthywaa50xwsqvarm0tahu0qfkq6ktuf3wd8azaas0h24c9myfz7";

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("[IT-SPORE-001] Should construct Spore mint skeleton successfully", async () => {
    const mockToy = {
      name: "LEGO Star Wars",
      condition: "NEW",
      category: "BUILDING_SETS",
      listedAt: new Date().toISOString(),
      region: "UK",
      imageHash: "0x123",
    };

    const { txSkeleton, outputIndex } = await prepareMintToyPassport(dummySeller, mockToy);
    
    expect(txSkeleton).toBeDefined();
    expect(outputIndex).toBe(0); // Spores are generated at index 0 of outputs
  });

  test("[IT-SPORE-002] Should execute Spore minting and generate valid outpoint", async () => {
    const mockToy = {
      name: "Vintage Transformer G1",
      condition: "GOOD",
      category: "ACTION_FIGURES",
      listedAt: new Date().toISOString(),
      region: "UK",
      imageHash: "0xabc",
    };

    const result = await executeMintToyPassport(dummySeller, mockToy);
    expect(result).toBeDefined();
    expect(result.sporeDobId).toBeDefined();
    expect(result.sporeDobId).toContain(":0");
    expect(result.txHash.startsWith("0x")).toBe(true);
  });

  test("[IT-SPORE-003] Should execute Spore transfer and generate transfer hash", async () => {
    const sporeId = "0x" + "1".repeat(64) + ":0";
    const result = await executeTransferToyPassport(sporeId, dummySeller, dummyBuyer);

    expect(result).toBeDefined();
    expect(result.sporeDobId).toBe(sporeId);
    expect(result.txHash.startsWith("0x")).toBe(true);
  });

  test("[IT-SPORE-004] Should mint Spore DOB on first meetup handover and update listing/passport", async () => {
    const seller = await prisma.user.create({
      data: { joyIdAddress: `ckt1_spore_seller_${Date.now()}`, displayName: "Spore Seller" },
    });
    const buyer = await prisma.user.create({
      data: { joyIdAddress: `ckt1_spore_buyer_${Date.now()}`, displayName: "Spore Buyer" },
    });
    const listing = await prisma.listing.create({
      data: {
        title: "Spore Initial Mint Toy",
        description: "Brand new unopened box",
        priceFiat: 45,
        currency: "GBP",
        condition: "NEW",
        category: "BUILDING_SETS",
        sellerId: seller.id,
        status: "RESERVED",
        imageUrls: JSON.stringify(["https://example.com/spore.jpg"]),
        tradeMethod: "MEETUP",
        sporeDobId: null, // First time listing, no Spore DOB yet
      },
    });

    const token = `tok_${Date.now()}`;
    const trade = await prisma.trade.create({
      data: {
        listingId: listing.id,
        sellerId: seller.id,
        buyerId: buyer.id,
        priceFiat: 45,
        priceCkb: BigInt("4500000000"),
        exchangeRate: 0.02,
        method: "MEETUP",
        status: "ESCROW_FUNDED",
        qrCodeToken: token,
        qrCodeExpiresAt: new Date(Date.now() + 3600000),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const req = new Request(`http://localhost:3000/api/trades/${trade.id}/qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        buyerAddress: buyer.joyIdAddress,
      }),
    });

    const res = await completeQrHandover(req, { params: Promise.resolve({ id: trade.id }) });
    expect(res.status).toBe(200);

    // Verify listing now has sporeDobId populated
    const updatedListing = await prisma.listing.findUnique({
      where: { id: listing.id },
      include: { passportLogs: true },
    });
    expect(updatedListing?.sporeDobId).toBeDefined();
    expect(updatedListing?.sporeDobId).toContain(":0");
    expect(updatedListing?.status).toBe("TRADED");
    expect(updatedListing?.passportLogs.length).toBeGreaterThan(0);

    // Verify passport API exposes the Spore DOB cell
    const passportRes = await getPassport(
      new Request(`http://localhost:3000/api/passport/${listing.id}`),
      { params: Promise.resolve({ id: listing.id }) }
    );
    expect(passportRes.status).toBe(200);
    const passportData = await passportRes.json();
    expect(passportData.sporeDobId).toBe(updatedListing?.sporeDobId);
    expect(passportData.onChainData).toBeDefined();

    // Clean up test records
    await prisma.passportLog.deleteMany({ where: { listingId: listing.id } });
    await prisma.notification.deleteMany({ where: { userId: { in: [seller.id, buyer.id] } } });
    await prisma.trade.delete({ where: { id: trade.id } });
    await prisma.listing.delete({ where: { id: listing.id } });
    await prisma.user.deleteMany({ where: { id: { in: [seller.id, buyer.id] } } });
  });

  test("[IT-SPORE-005] Should transfer existing Spore DOB on resale handover without recreating cell", async () => {
    const existingSporeId = `0x${Date.now().toString(16).padStart(16, "0")}${"a".repeat(48)}:0`;
    const seller = await prisma.user.create({
      data: { joyIdAddress: `ckt1_resale_seller_${Date.now()}`, displayName: "Resale Seller" },
    });
    const buyer = await prisma.user.create({
      data: { joyIdAddress: `ckt1_resale_buyer_${Date.now()}`, displayName: "Resale Buyer" },
    });
    const listing = await prisma.listing.create({
      data: {
        title: "Resale Toy With Pre-existing Spore",
        description: "Second owner handover",
        priceFiat: 40,
        currency: "GBP",
        condition: "LIKE_NEW",
        category: "BUILDING_SETS",
        sellerId: seller.id,
        status: "RESERVED",
        imageUrls: JSON.stringify(["https://example.com/resale.jpg"]),
        tradeMethod: "MEETUP",
        sporeDobId: existingSporeId, // Pre-existing Spore DOB attached
      },
    });

    const token = `resale_tok_${Date.now()}`;
    const trade = await prisma.trade.create({
      data: {
        listingId: listing.id,
        sellerId: seller.id,
        buyerId: buyer.id,
        priceFiat: 40,
        priceCkb: BigInt("4000000000"),
        exchangeRate: 0.02,
        method: "MEETUP",
        status: "ESCROW_FUNDED",
        qrCodeToken: token,
        qrCodeExpiresAt: new Date(Date.now() + 3600000),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const req = new Request(`http://localhost:3000/api/trades/${trade.id}/qr`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        buyerAddress: buyer.joyIdAddress,
      }),
    });

    const res = await completeQrHandover(req, { params: Promise.resolve({ id: trade.id }) });
    expect(res.status).toBe(200);

    const updatedListing = await prisma.listing.findUnique({
      where: { id: listing.id },
      include: { passportLogs: true },
    });
    // The sporeDobId must remain the original one (cell preserved, only transferred)
    expect(updatedListing?.sporeDobId).toBe(existingSporeId);
    expect(updatedListing?.sporeTxHash).toBeDefined();

    // Clean up test records
    await prisma.passportLog.deleteMany({ where: { listingId: listing.id } });
    await prisma.notification.deleteMany({ where: { userId: { in: [seller.id, buyer.id] } } });
    await prisma.trade.delete({ where: { id: trade.id } });
    await prisma.listing.delete({ where: { id: listing.id } });
    await prisma.user.deleteMany({ where: { id: { in: [seller.id, buyer.id] } } });
  });
});

