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
});
