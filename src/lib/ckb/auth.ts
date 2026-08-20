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
  // 1. Development/Testing/Demo Mock Signature Bypass
  if (
    signature === `mock-sig-${joyIdAddress}` ||
    signature.startsWith("mock-sig-")
  ) {
    return true;
  }

  try {
    // If the signature payload is a JSON string, it is a JoyID signature package
    if (signature.trim().startsWith("{")) {
      const { signatureData, clientData } = JSON.parse(signature);
      
      // Parse address to retrieve public key or parse directly
      // ccc.verifyMessageJoyId(challenge, signatureDataJson, clientDataJson)
      // verifyMessageJoyId returns true if the signature is cryptographically valid
      return await ccc.verifyMessageJoyId(
        message,
        JSON.stringify(signatureData),
        JSON.stringify(clientData)
      );
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
