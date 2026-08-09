import "dotenv/config";

/**
 * Visual search query mockup using SerpApi Google Lens.
 * For MVP/Learning, we return a mock reference price based on the image URL/content hash
 * to preserve the free SerpApi quota limit (250 searches/month).
 */
export async function getReferencePrice(imageUrl: string, currency: "GBP" | "VND"): Promise<number | null> {
  const apiKey = process.env.SERPAPI_API_KEY;
  
  if (!apiKey || apiKey === "your_serpapi_api_key_here") {
    // Return static mock values if no API key is specified
    return currency === "GBP" ? 25.0 : 750000.0;
  }

  try {
    const response = await fetch(
      `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(imageUrl)}&api_key=${apiKey}`
    );
    const data = await response.json();

    // Parse matches to look for prices in shopping results
    const visualMatches = data.visual_matches || [];
    const prices: number[] = [];

    for (const match of visualMatches) {
      if (match.price && match.price.amount) {
        prices.push(parseFloat(match.price.amount));
      }
    }

    if (prices.length > 0) {
      // Calculate average price
      const sum = prices.reduce((a, b) => a + b, 0);
      const avg = sum / prices.length;
      return parseFloat(avg.toFixed(2));
    }

    return null;
  } catch (error) {
    console.error("SerpApi lookup failed:", error);
    // Fallback estimate
    return currency === "GBP" ? 30.0 : 900000.0;
  }
}
