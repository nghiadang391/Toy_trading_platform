import { ccc } from "@ckb-ccc/core";

/**
 * Validates a signature against a message and public lock address.
 * Supports JoyID signatures, CKB Secp256k1 message signing, and local dev mock signatures.
 */
export async function verifySignature(
  message: string,
  signature: string,
  joyIdAddress: string
): Promise<boolean> {
  // 1. Development/Testing Mock Signature Bypass (Strictly gated by env)
  const isMockAuthAllowed =
    process.env.NODE_ENV !== "production" &&
    (process.env.ENABLE_MOCK_AUTH === "true" || process.env.NODE_ENV === "test");

  if (isMockAuthAllowed && signature === `mock-sig-${joyIdAddress}`) {
    return true;
  }

  try {
    // If the signature payload is a JSON string, it is a JoyID signature package
    if (signature.trim().startsWith("{")) {
      const parsed = JSON.parse(signature);

      // 1. Direct JoyID SignMessageResponseData verification (from signChallenge)
      if (parsed.signature && (parsed.pubkey || parsed.publicKey)) {
        try {
          const { verifySignature: joyidVerify } = await import("@joyid/ckb");
          const isValid = await joyidVerify(parsed);
          if (isValid) return true;
        } catch (joyidErr) {
          console.warn("JoyID native verification attempt error:", joyidErr);
        }
      }

      // 2. Fallback CCC JoyID verification
      const { signatureData, clientData } = parsed;
      if (signatureData && clientData) {
        return await ccc.verifyMessageJoyId(
          message,
          typeof signatureData === "string" ? signatureData : JSON.stringify(signatureData),
          typeof clientData === "string" ? clientData : JSON.stringify(clientData)
        );
      }
    }

    // 2. Standard CKB Secp256k1 Message signing
    // verifyMessageCkbSecp256k1 expects (address, message, signature)
    return ccc.verifyMessageCkbSecp256k1(
      joyIdAddress,
      message,
      signature
    );
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}
