import { verifySignature } from "../src/lib/ckb/auth";

describe("Cryptographic Signature Verification Tests", () => {
  const dummyAddress = "ckt1qzda0crj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g0cj2v64chvj3g0";

  test("Should validate valid mock signature in development mode", async () => {
    const message = "create-listing:lego-falcon";
    const signature = `mock-sig-${dummyAddress}`;
    
    const isValid = await verifySignature(message, signature, dummyAddress);
    expect(isValid).toBe(true);
  });

  test("Should reject invalid mock signature in development mode", async () => {
    const message = "create-listing:lego-falcon";
    const signature = `invalid-signature`;
    
    const isValid = await verifySignature(message, signature, dummyAddress);
    expect(isValid).toBe(false);
  });
});
