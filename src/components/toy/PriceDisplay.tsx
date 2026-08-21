"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface PriceDisplayProps {
  sellerPrice: number;
  referencePrice: number | null;
  currency: "GBP" | "VND";
  preloadedRate?: number | null;
}

// Module-level client cache for instant client-side rendering
let clientCachedRate: { rate: number; currency: string; timestamp: number } | null = null;

export default function PriceDisplay({ sellerPrice, referencePrice, currency, preloadedRate }: PriceDisplayProps) {
  const [ckbRate, setCkbRate] = useState<number | null>(() => {
    if (typeof preloadedRate === "number") return preloadedRate;
    if (clientCachedRate && clientCachedRate.currency === currency && Date.now() - clientCachedRate.timestamp < 60000) {
      return clientCachedRate.rate;
    }
    return null;
  });
  const [loading, setLoading] = useState(!preloadedRate && !ckbRate);
  const { t } = useLanguage();

  const symbol = currency === "GBP" ? "£" : "₫";

  useEffect(() => {
    if (typeof preloadedRate === "number") {
      setCkbRate(preloadedRate);
      setLoading(false);
      return;
    }

    if (clientCachedRate && clientCachedRate.currency === currency && Date.now() - clientCachedRate.timestamp < 60000) {
      setCkbRate(clientCachedRate.rate);
      setLoading(false);
      return;
    }

    async function fetchRate() {
      try {
        const res = await fetch(`/api/price/ckb?currency=${currency}`);
        const data = await res.json();
        if (data.rate) {
          setCkbRate(data.rate);
          clientCachedRate = { rate: data.rate, currency, timestamp: Date.now() };
        }
      } catch (err) {
        console.error("Failed to load CKB exchange rate:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRate();
  }, [currency, preloadedRate]);

  // Calculate CKB equivalent
  const ckbAmount = ckbRate ? Math.round(sellerPrice / ckbRate) : null;

  return (
    <div className="price-display-container">
      <div className="prices-grid">
        {/* 1. Seller Price */}
        <div className="price-item seller-price">
          <span className="price-label">{t("sellerPrice")}</span>
          <span className="price-value">{symbol}{sellerPrice.toLocaleString()}</span>
        </div>

        {/* 2. Reference Market Price */}
        <div className="price-item market-price">
          <span className="price-label">{t("marketReference")}</span>
          <span className="price-value">
            {referencePrice ? `${symbol}${referencePrice.toLocaleString()}` : "N/A"}
          </span>
          {referencePrice && sellerPrice > referencePrice * 1.5 && (
            <span className="price-warning-tag">⚠️ {t("overpriced")}</span>
          )}
        </div>

        {/* 3. Dynamic CKB Settle Price */}
        <div className="price-item ckb-price">
          <span className="price-label">{t("settleCost")}</span>
          <span className="price-value">
            {loading ? (
              <span className="price-loader">Loading live feed...</span>
            ) : ckbAmount ? (
              `≈ ${ckbAmount.toLocaleString()} CKB`
            ) : (
              t("feedOffline")
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
