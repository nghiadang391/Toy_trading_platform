import { fiberClient } from "../src/lib/fiber/fnnClient";
import { prisma } from "../src/lib/prisma";
import { POST as settleFiberPayment } from "../src/app/api/fiber/pay/route";

describe("Fiber Network (L2) Integration Tests", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("[IT-PAY-001] Should generate valid Fiber invoice with amount and payment hash", async () => {
    const amountShannons = "10000000000"; // 100 CKB
    const description = "Test Toy Handover";

    const invoice = await fiberClient.createInvoice(amountShannons, description);

    expect(invoice).toBeDefined();
    expect(invoice.invoice_address).toBeDefined();
    expect(invoice.payment_hash).toBeDefined();
    expect(invoice.payment_hash.startsWith("0x")).toBe(true);
    expect(invoice.amount).toBe(amountShannons);
  });

  test("[IT-PAY-002] Should dispatch payment and release preimage proof of payment", async () => {
    const invoice = await fiberClient.createInvoice("5000000000", "Toy Trade Settlement");
    const paymentResult = await fiberClient.sendPayment(invoice.invoice_address);

    expect(paymentResult).toBeDefined();
    expect(paymentResult.status).toBe("Success");
    expect(paymentResult.preimage).toBeDefined();
    expect(paymentResult.preimage?.startsWith("0x")).toBe(true);
  });

  test("[IT-PAY-003] Should report health status gracefully", async () => {
    const health = await fiberClient.checkHealth();
    expect(health).toBeDefined();
    expect(typeof health.isAvailable).toBe("boolean");
  });

  test("[IT-PAY-004] Should run pre-flight probe and classify route viability", async () => {
    const { runPreflightProbe, parseFiberError, classifyProbeResult } = await import("../src/lib/fiber/prober");
    const probe = await runPreflightProbe("fbr_mock_test_invoice_address");

    expect(probe.viable).toBe(true);
    expect(probe.classification).toBe("ROUTE_VIABLE");

    // Test error parsing
    const parsedInsufficient = parseFiberError("Insufficient balance: max outbound liquidity 500 is insufficient");
    expect(parsedInsufficient.code).toBe("InsufficientLocalBalance");
    expect(parsedInsufficient.suggestion).toContain("liquidity is insufficient");

    const parsedNoRoute = parseFiberError("Failed to build route to target node");
    expect(parsedNoRoute.code).toBe("NoRouteFound");

    // Test probe classification
    expect(classifyProbeResult("IncorrectOrUnknownPaymentDetails")).toBe("ROUTE_VIABLE");
    expect(classifyProbeResult("NoRouteFound")).toBe("ROUTE_BLOCKED");
  });
  test("[IT-PAY-005] Fiber payment rejects unauthorized caller address (Security Gap 2)", async () => {
    const testSeller = await prisma.user.create({
      data: { joyIdAddress: `ckt1_fbr_seller_${Date.now()}`, displayName: "Fbr Seller" },
    });
    const testBuyer = await prisma.user.create({
      data: { joyIdAddress: `ckt1_fbr_buyer_${Date.now()}`, displayName: "Fbr Buyer" },
    });
    const testIntruder = await prisma.user.create({
      data: { joyIdAddress: `ckt1_fbr_intruder_${Date.now()}`, displayName: "Fbr Intruder" },
    });
    const testListing = await prisma.listing.create({
      data: {
        title: "Fiber Test Toy",
        description: "Test description",
        priceFiat: 50,
        currency: "GBP",
        condition: "LIKE_NEW",
        category: "ACTION_FIGURES",
        sellerId: testSeller.id,
        status: "RESERVED",
        imageUrls: JSON.stringify(["https://example.com/toy.jpg"]),
        tradeMethod: "MEETUP",
      },
    });
    const testTrade = await prisma.trade.create({
      data: {
        listingId: testListing.id,
        sellerId: testSeller.id,
        buyerId: testBuyer.id,
        priceFiat: 50,
        priceCkb: BigInt("5000000000"),
        exchangeRate: 0.02,
        method: "MEETUP",
        status: "ESCROW_FUNDED",
        fiberInvoice: "fbr_mock_inv_for_test",
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const intruderReq = new Request("http://localhost:3000/api/fiber/pay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tradeId: testTrade.id,
        callerAddress: testIntruder.joyIdAddress,
      }),
    });

    const res = await settleFiberPayment(intruderReq);
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toContain("Forbidden");

    // Clean up
    await prisma.trade.delete({ where: { id: testTrade.id } });
    await prisma.listing.delete({ where: { id: testListing.id } });
    await prisma.user.deleteMany({
      where: { id: { in: [testSeller.id, testBuyer.id, testIntruder.id] } },
    });
  });
});
