import { fiberClient } from "../src/lib/fiber/fnnClient";
import { prisma } from "../src/lib/prisma";

describe("Fiber Network (L2) Integration Tests", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  test("Should generate valid Fiber invoice with amount and payment hash", async () => {
    const amountShannons = "10000000000"; // 100 CKB
    const description = "Test Toy Handover";

    const invoice = await fiberClient.createInvoice(amountShannons, description);

    expect(invoice).toBeDefined();
    expect(invoice.invoice_address).toBeDefined();
    expect(invoice.payment_hash).toBeDefined();
    expect(invoice.payment_hash.startsWith("0x")).toBe(true);
    expect(invoice.amount).toBe(amountShannons);
  });

  test("Should dispatch payment and release preimage proof of payment", async () => {
    const invoice = await fiberClient.createInvoice("5000000000", "Toy Trade Settlement");
    const paymentResult = await fiberClient.sendPayment(invoice.invoice_address);

    expect(paymentResult).toBeDefined();
    expect(paymentResult.status).toBe("Success");
    expect(paymentResult.preimage).toBeDefined();
    expect(paymentResult.preimage?.startsWith("0x")).toBe(true);
  });

  test("Should report health status gracefully", async () => {
    const health = await fiberClient.checkHealth();
    expect(health).toBeDefined();
    expect(typeof health.isAvailable).toBe("boolean");
  });

  test("Should run pre-flight probe and classify route viability", async () => {
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
});
