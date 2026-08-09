import "dotenv/config";

/**
 * Fetches the live CKB exchange rate from CoinGecko.
 * Returns fiat value per 1 CKB.
 */
export async function getLiveCkbPrice(fiat: "gbp" | "vnd"): Promise<number> {
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
    return data["nervos-network"][fiat];
  } catch (error) {
    console.error("CoinGecko price fetch failed:", error);
    // Fallback static rates: 1 CKB = ~0.0085 GBP, ~210 VND
    return fiat === "gbp" ? 0.0085 : 210.0;
  }
}
