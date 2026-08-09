"use client";

import { useEffect, useState } from "react";

interface PriceDisplayProps {
  sellerPrice: number;
  referencePrice: number | null;
  currency: "GBP" | "VND";
}

export default function PriceDisplay({ sellerPrice, referencePrice, currency }: PriceDisplayProps) {
  const [ckbRate, setCkbRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const symbol = currency === "GBP" ? "£" : "₫";

  useEffect(() => {
    async function fetchRate() {
      try {
        const res = await fetch(`/api/price/ckb?currency=${currency}`);
        const data = await res.json();
        if (data.rate) {
          setCkbRate(data.rate);
        }
      } catch (err) {
        console.error("Failed to load CKB exchange rate:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRate();
    const interval = setInterval(fetchRate, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, [currency]);

  // Calculate CKB equivalent
  // rate represents fiat value of 1 CKB. 
  // CKB Amount = fiat price / rate
  const ckbAmount = ckbRate ? Math.round(sellerPrice / ckbRate) : null;

  return (
    <div className="price-display-container">
      <div className="prices-grid">
        {/* 1. Seller Price */}
        <div className="price-item seller-price">
          <span className="price-label">Seller Price</span>
          <span className="price-value">{symbol}{sellerPrice.toLocaleString()}</span>
        </div>

        {/* 2. Reference Market Price */}
        <div className="price-item market-price">
          <span className="price-label">Market Reference</span>
          <span className="price-value">
            {referencePrice ? `${symbol}${referencePrice.toLocaleString()}` : "N/A"}
          </span>
          {referencePrice && sellerPrice > referencePrice * 1.5 && (
            <span className="price-warning-tag">⚠️ Overpriced</span>
          )}
        </div>

        {/* 3. Dynamic CKB Settle Price */}
        <div className="price-item ckb-price">
          <span className="price-label">Settle Cost</span>
          <span className="price-value">
            {loading ? (
              <span className="price-loader">Loading live feed...</span>
            ) : ckbAmount ? (
              `≈ ${ckbAmount.toLocaleString()} CKB`
            ) : (
              "Feed Offline"
            )}
          </span>
        </div>
      </div>

      <style jsx>{`
        .price-display-container {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
          font-family: Inter, system-ui, sans-serif;
        }
        .prices-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .price-item {
          display: flex;
          flex-direction: column;
        }
        .price-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          margin-bottom: 4px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .price-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
        }
        .seller-price .price-value {
          color: #4facfe;
        }
        .market-price .price-value {
          color: #a1a1aa;
        }
        .ckb-price .price-value {
          color: #00ff87;
        }
        .price-warning-tag {
          font-size: 0.7rem;
          color: #ff4757;
          font-weight: 600;
          margin-top: 4px;
        }
        .price-loader {
          font-size: 0.9rem;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
}
