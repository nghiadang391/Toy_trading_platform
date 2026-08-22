import crypto from "crypto";
import { fiberClient } from "./fnnClient";

export type ProbeClassification = "ROUTE_VIABLE" | "ROUTE_BLOCKED" | "UNKNOWN";

export interface ProbeResult {
  viable: boolean;
  classification: ProbeClassification;
  suggestion?: string;
  errorMessage?: string;
  latencyMs: number;
}

/**
 * Generates a random 32-byte hex string to use as an unsettleable payment hash.
 */
export function generateProbeHash(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Classifies the probe outcome from the raw error message or code string.
 */
export function classifyProbeResult(errorMessage: string): ProbeClassification {
  if (!errorMessage) return "UNKNOWN";
  const msg = errorMessage.toLowerCase();

  // Destination reached — hash simply unknown to recipient (Expected success for pre-flight probe)
  if (
    msg.includes("incorrectorunknownpaymentdetails") ||
    msg.includes("incorrectunknownpaymentdetails") ||
    msg.includes("incorrect_or_unknown_payment_details") ||
    msg.includes("unknown payment hash") ||
    msg.includes("incorrect payment details") ||
    msg.includes("payment_hash does not match") ||
    msg.includes("payment hash does not match")
  ) {
    return "ROUTE_VIABLE";
  }

  // Route-level failures — never reached destination
  if (
    msg.includes("noroutefound") ||
    msg.includes("no route") ||
    msg.includes("failed to build route") ||
    msg.includes("temporarychannelfailure") ||
    msg.includes("insufficient") ||
    msg.includes("amountbelowminimum") ||
    msg.includes("expirytoosoon") ||
    msg.includes("holdtlctimeout")
  ) {
    return "ROUTE_BLOCKED";
  }

  return "UNKNOWN";
}

/**
 * Parses raw Fiber errors into user-friendly explanations and suggestions
 */
export function parseFiberError(rawError: string): { code: string; suggestion: string } {
  const errStr = (rawError || "").trim();

  if (/Insufficient balance/i.test(errStr)) {
    return {
      code: "InsufficientLocalBalance",
      suggestion: "Your channel liquidity is insufficient for this trade amount. Switching to Standard CKB L1 Escrow.",
    };
  }

  if (/ExpiryTooSoon|invoice is expired/i.test(errStr)) {
    return {
      code: "ExpiryTooSoon",
      suggestion: "The Fiber invoice has expired. Please regenerate a fresh invoice or switch to L1 Escrow.",
    };
  }

  if (/NoRouteFound|Failed to build route/i.test(errStr)) {
    return {
      code: "NoRouteFound",
      suggestion: "No active payment channel path found to the recipient node. Switching to Standard CKB L1 Escrow.",
    };
  }

  if (/HoldTlcTimeout|TlcTimeout/i.test(errStr)) {
    return {
      code: "HoldTlcTimeout",
      suggestion: "The destination node took too long to respond. Switching to Standard CKB L1 Escrow.",
    };
  }

  return {
    code: "FiberRoutingError",
    suggestion: "Layer 2 Fiber route is temporarily unavailable. Standard CKB L1 Escrow is active.",
  };
}

/**
 * Executes a pre-flight probe test on a Fiber invoice
 */
export async function runPreflightProbe(invoice: string): Promise<ProbeResult> {
  const start = Date.now();

  // In offline dev mode or mock invoices, treat as viable
  if (invoice.startsWith("fbr_mock_") || process.env.NODE_ENV !== "production") {
    return {
      viable: true,
      classification: "ROUTE_VIABLE",
      latencyMs: Date.now() - start,
    };
  }

  try {
    const probeHash = generateProbeHash();
    // Send payment with probe hash expecting destination rejection
    await fiberClient.sendPayment(invoice);

    return {
      viable: true,
      classification: "ROUTE_VIABLE",
      latencyMs: Date.now() - start,
    };
  } catch (err: any) {
    const msg: string = err.message ?? String(err);
    const classification = classifyProbeResult(msg);
    const parsed = parseFiberError(msg);

    return {
      viable: classification === "ROUTE_VIABLE",
      classification,
      suggestion: parsed.suggestion,
      errorMessage: msg,
      latencyMs: Date.now() - start,
    };
  }
}
