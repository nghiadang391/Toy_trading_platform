/**
 * Fiber Network Node (FNN) JSON-RPC Client
 * Connects ToyTrade to Layer 2 payment channels for instant settlement.
 */

export interface FnnNodeInfo {
  node_id: string;
  node_name?: string;
  addresses?: string[];
  open_channels_count?: number;
}

export interface FnnInvoiceResult {
  invoice_address: string;
  payment_hash: string;
  amount: string; // in shannons (hex or decimal)
  description?: string;
  expiry?: string;
}

export interface FnnPaymentResult {
  payment_hash: string;
  status: "Success" | "Failed" | "Pending";
  preimage?: string;
  fee?: string;
}

export interface FiberHealthStatus {
  isAvailable: boolean;
  nodeId?: string;
  latencyMs?: number;
  reason?: string;
}

export class FiberClient {
  private rpcUrl: string;
  private timeoutMs: number;

  constructor(rpcUrl?: string, timeoutMs: number = 3000) {
    this.rpcUrl = rpcUrl || process.env.FIBER_RPC_URL || "http://127.0.0.1:9227";
    this.timeoutMs = timeoutMs;
  }

  /**
   * Execute JSON-RPC request to Fiber Network Node
   */
  private async callRpc<T>(method: string, params: any[] = []): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(this.rpcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method,
          params,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`FNN HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(`FNN RPC Error (${data.error.code}): ${data.error.message}`);
      }

      return data.result as T;
    } catch (err: any) {
      if (err.name === "AbortError") {
        throw new Error(`FNN RPC Timeout (${this.timeoutMs}ms exceeded) calling ${method}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Check if the Fiber Node is reachable and responsive
   */
  async checkHealth(): Promise<FiberHealthStatus> {
    const startTime = Date.now();
    try {
      const nodeInfo = await this.callRpc<FnnNodeInfo>("node_info", []);
      return {
        isAvailable: true,
        nodeId: nodeInfo.node_id,
        latencyMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        isAvailable: false,
        reason: err.message || "FNN node unreachable",
      };
    }
  }

  /**
   * Create a new Fiber payment invoice for a toy purchase
   * @param amountShannons Hex or decimal string of CKB shannons
   * @param description Brief trade description
   */
  async createInvoice(
    amountShannons: string,
    description: string
  ): Promise<FnnInvoiceResult> {
    // In dev mode, if FNN is not running, provide a structured mock invoice
    try {
      const health = await this.checkHealth();
      if (!health.isAvailable && process.env.NODE_ENV !== "production") {
        return this.generateDevMockInvoice(amountShannons, description);
      }

      const res = await this.callRpc<FnnInvoiceResult>("new_invoice", [{
        amount: amountShannons.startsWith("0x") ? amountShannons : `0x${BigInt(amountShannons).toString(16)}`,
        currency: "FIBER",
        description,
        expiry: "0x708", // 1800s (30 mins) in hex
      }]);

      return res;
    } catch (err) {
      if (process.env.NODE_ENV !== "production") {
        return this.generateDevMockInvoice(amountShannons, description);
      }
      throw err;
    }
  }

  /**
   * Send a payment for an invoice over Fiber payment channels
   */
  async sendPayment(invoice: string): Promise<FnnPaymentResult> {
    if (invoice.startsWith("fbr_mock_") || process.env.NODE_ENV !== "production") {
      return {
        payment_hash: "0x" + (invoice.startsWith("fbr_mock_") ? invoice.replace("fbr_mock_", "").slice(0, 64) : "mockhash123"),
        status: "Success",
        preimage: "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(""),
        fee: "0x0",
      };
    }

    return this.callRpc<FnnPaymentResult>("send_payment", [{ invoice }]);
  }

  /**
   * Query status / settlement of a specific payment hash
   */
  async getPayment(paymentHash: string): Promise<FnnPaymentResult> {
    if (paymentHash.startsWith("0xmock") && process.env.NODE_ENV !== "production") {
      return {
        payment_hash: paymentHash,
        status: "Success",
        preimage: "0xmockpreimage" + paymentHash.slice(6),
      };
    }

    return this.callRpc<FnnPaymentResult>("get_payment", [{ payment_hash: paymentHash }]);
  }

  /**
   * Generates a simulated dev Fiber invoice when developing offline without a running local FNN daemon
   */
  private generateDevMockInvoice(
    amountShannons: string,
    description: string
  ): FnnInvoiceResult {
    const randomHex = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    return {
      invoice_address: `fbr_mock_${randomHex}`,
      payment_hash: `0x${randomHex}`,
      amount: amountShannons,
      description,
      expiry: "1800",
    };
  }
}

// Default singleton instance
export const fiberClient = new FiberClient();
