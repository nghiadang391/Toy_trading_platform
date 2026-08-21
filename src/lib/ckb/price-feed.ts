import "dotenv/config";

// In-memory 60-second price cache to avoid CoinGecko rate limits and 500ms latency
const priceCache: Record<string, { rate: number; timestamp: number }> = {};
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

/**
 * Fetches the live CKB exchange rate with in-memory caching.
 * Returns fiat value per 1 CKB.
 */
export async function getLiveCkbPrice(fiat: "gbp" | "vnd"): Promise<number> {
  const cached = priceCache[fiat];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.rate;
  }

  const apiKey = process.env.COINGECKO_API_KEY;
  const headers: any = {};
  if (apiKey) {
    headers["x-cg-demo-api-key"] = apiKey;
  }

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=nervos-network&vs_currencies=${fiat}`,
      { headers }
    );
    const data = await response.json();
    const rate = data?.["nervos-network"]?.[fiat];
    
    if (typeof rate === "number") {
      priceCache[fiat] = { rate, timestamp: Date.now() };
      return rate;
    }
    
    // If response format unexpected, use fallback
    return fiat === "gbp" ? 0.0085 : 210.0;
  } catch (error) {
    console.error("CoinGecko price fetch failed:", error);
    // Fallback static rates: 1 CKB = ~0.0085 GBP, ~210 VND
    return fiat === "gbp" ? 0.0085 : 210.0;
  }
}
