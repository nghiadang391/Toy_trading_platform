"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/LanguageContext";
import { useUser } from "@/lib/UserContext";

interface Listing {
  id: string;
  title: string;
  description: string;
  condition: string;
  category: string;
  priceFiat: number;
  currency: "GBP" | "VND";
  imageUrls: string[];
  tradeMethod: string;
  shippingRegion: string;
  location: string | null;
  sellerId: string;
  seller: {
    displayName: string;
    joyIdAddress: string;
    rating?: number | null;
    reviewCount?: number;
  };
}

interface BuyToyModalProps {
  listing: Listing | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (trade: any) => void;
}

export default function BuyToyModal({
  listing,
  isOpen,
  onClose,
  onSuccess,
}: BuyToyModalProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, connectWallet } = useUser();
  const [ckbRate, setCkbRate] = useState<number | null>(null);
  const [loadingRate, setLoadingRate] = useState(true);
  const [selectedMethod, setSelectedMethod] = useState<string>("MEETUP");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTrade, setCreatedTrade] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !listing) return;
    setError(null);
    setSubmitting(false);
    setCreatedTrade(null);

    // Default method to listing's allowed method
    if (listing.tradeMethod === "SHIPPING") {
      setSelectedMethod("SHIPPING");
    } else {
      setSelectedMethod("MEETUP");
    }

    // Fetch live CKB exchange rate
    async function fetchRate() {
      setLoadingRate(true);
      try {
        const res = await fetch(`/api/price/ckb?currency=${listing?.currency || "gbp"}`);
        const data = await res.json();
        if (data.rate) {
          setCkbRate(data.rate);
        }
      } catch (err) {
        console.warn("Failed to fetch live CKB price:", err);
      } finally {
        setLoadingRate(false);
      }
    }

    fetchRate();
  }, [isOpen, listing]);

  if (!isOpen || !listing) return null;

  const symbol = listing.currency === "GBP" ? "£" : "₫";
  const ckbAmount = ckbRate ? Math.round(Number(listing.priceFiat) / ckbRate) : null;
  const shannons = ckbAmount ? (BigInt(ckbAmount) * 100_000_000n).toString() : "0";

  const handleConfirmPurchase = async () => {
    setError(null);

    // 1. Ensure user is connected
    let activeUser = user;
    if (!activeUser) {
      activeUser = await connectWallet();
      if (!activeUser) {
        setError("Please connect your JoyID Passkey wallet to purchase.");
        return;
      }
    }

    if (activeUser.id === listing.sellerId) {
      setError("You cannot purchase your own listing.");
      return;
    }

    if (!ckbRate || !ckbAmount) {
      setError("Exchange rate unavailable. Please try again.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/trades", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId: listing.id,
          buyerId: activeUser.id,
          method: selectedMethod,
          priceFiat: Number(listing.priceFiat),
          priceCkb: shannons,
          exchangeRate: ckbRate,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCreatedTrade(data);
        onSuccess(data);
      } else {
        setError(data.error || "Failed to initiate trade. Please try again.");
      }
    } catch (err: any) {
      console.error("Trade initiation failed:", err);
      setError("Network error while creating trade. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {createdTrade ? (
          <>
            <div className="modal-header">
              <div className="header-title">
                <span className="escrow-pill">CKB Escrow Secured</span>
                <h2>{t("toyReservedTitle") || "Toy Reserved & Escrow Locked"}</h2>
              </div>
              <button className="close-btn" onClick={onClose}>✕</button>
            </div>

            <div className="modal-body p-6 space-y-4">
              <div className="rounded-xl border border-[#00ff87]/30 bg-[#00ff87]/10 p-4">
                <p className="font-semibold text-[#00ff87] text-sm">
                  On-Chain Escrow Protection Active
                </p>
                <p className="text-white/80 text-xs mt-1 leading-relaxed">
                  Your payment of ≈ {ckbAmount?.toLocaleString()} CKB is locked in the on-chain CKB escrow contract. The seller has been notified to hold the toy for you.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2">
                <p className="text-xs font-bold text-white uppercase tracking-wider">Meetup & Inspection Rule:</p>
                <ol className="text-xs text-white/70 space-y-1.5 list-decimal pl-4">
                  <li>Use Chat to coordinate your meetup time and location with the seller.</li>
                  <li>Inspect the toy in person to verify its condition before releasing funds.</li>
                  <li>When you are satisfied during the meetup, tap <strong>Meetup Handover</strong> on the toy listing or in your Profile to scan the seller's QR code.</li>
                </ol>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#60efff] text-black font-bold text-sm hover:opacity-90 transition-opacity"
                  onClick={() => {
                    onClose();
                    router.push("/profile");
                  }}
                >
                  View in My Profile
                </button>
                <button
                  type="button"
                  className="w-full py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 text-white font-medium text-xs hover:bg-white/10 transition-colors"
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="modal-header">
              <div className="header-title">
                <span className="escrow-pill">CKB Escrow Protection</span>
                <h2>{t("confirmBuy")}</h2>
              </div>
              <button className="close-btn" onClick={onClose} disabled={submitting}>✕</button>
            </div>

            <div className="modal-body">
          {/* Toy Overview Card */}
          <div className="toy-summary">
            {listing.imageUrls?.[0] ? (
              <img src={listing.imageUrls[0]} alt={listing.title} className="toy-thumb" />
            ) : (
              <div className="toy-thumb-placeholder">🧸</div>
            )}
            <div className="toy-meta">
              <h3 className="toy-name">{listing.title}</h3>
              <p className="toy-desc line-clamp-2">{listing.description}</p>
              <div className="seller-badge">
                <span className="seller-label">{t("listedBy")}:</span>
                <strong className="seller-name">{listing.seller?.displayName}</strong>
                {listing.seller?.rating && (
                  <span className="seller-stars">★ {listing.seller.rating}</span>
                )}
              </div>
            </div>
          </div>

          {/* Pricing Breakdown */}
          <div className="price-breakdown">
            <div className="price-row">
              <span className="row-label">{t("sellerPrice")}:</span>
              <span className="row-value fiat-value">
                {symbol}{Number(listing.priceFiat).toLocaleString()} {listing.currency}
              </span>
            </div>
            <div className="price-row highlight">
              <span className="row-label">{t("settleCost")} (CKB):</span>
              <span className="row-value ckb-value">
                {loadingRate ? (
                  <span className="animate-pulse">Calculating rate...</span>
                ) : ckbAmount ? (
                  <>≈ {ckbAmount.toLocaleString()} CKB</>
                ) : (
                  "Price feed offline"
                )}
              </span>
            </div>
          </div>

          {/* Method Selection */}
          <div className="method-selection">
            <label className="section-label">{t("selectTradeMethod")}:</label>
            <div className="method-options">
              {(listing.tradeMethod === "MEETUP" || listing.tradeMethod === "BOTH") && (
                <button
                  type="button"
                  className={`method-btn ${selectedMethod === "MEETUP" ? "active" : ""}`}
                  onClick={() => setSelectedMethod("MEETUP")}
                >
                  <span className="btn-icon">🤝</span>
                  <div className="btn-text">
                    <strong>{t("method_MEETUP")}</strong>
                    <small>Verify with QR code in person</small>
                  </div>
                </button>
              )}
              {(listing.tradeMethod === "SHIPPING" || listing.tradeMethod === "BOTH") && (
                <button
                  type="button"
                  className={`method-btn ${selectedMethod === "SHIPPING" ? "active" : ""}`}
                  onClick={() => setSelectedMethod("SHIPPING")}
                >
                  <span className="btn-icon">📦</span>
                  <div className="btn-text">
                    <strong>{t("method_SHIPPING")}</strong>
                    <small>Delivery with tracking</small>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* CKB Escrow Explainer */}
          <div className="escrow-notice">
            <span className="notice-icon">🔒</span>
            <p className="notice-text">{t("escrowNotice")}</p>
          </div>

          {error && (
            <div className="error-alert">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer">
          <button 
            type="button" 
            className="cancel-btn" 
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
              <button
                type="button"
                className="confirm-btn"
                onClick={handleConfirmPurchase}
                disabled={submitting || loadingRate || !ckbAmount}
              >
                {submitting ? t("purchasing") : `🤝 ${t("confirmBuy")}`}
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .modal-content {
          background: #111113;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          width: 100%;
          max-width: 520px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
          display: flex;
          flex-col;
          animation: modalFadeIn 0.2s ease-out;
        }
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.96);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .escrow-pill {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #00ff87;
          background: rgba(0, 255, 135, 0.1);
          border: 1px solid rgba(0, 255, 135, 0.25);
          padding: 3px 8px;
          border-radius: 9999px;
          display: inline-block;
          margin-bottom: 6px;
        }
        .header-title h2 {
          font-size: 18px;
          font-weight: 700;
          color: white;
          margin: 0;
        }
        .close-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 18px;
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          transition: background 0.15s, color 0.15s;
        }
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }
        .modal-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .toy-summary {
          display: flex;
          gap: 16px;
          align-items: center;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
        }
        .toy-thumb {
          width: 64px;
          height: 64px;
          object-fit: cover;
          border-radius: 10px;
        }
        .toy-thumb-placeholder {
          width: 64px;
          height: 64px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
        }
        .toy-meta {
          flex: 1;
          min-width: 0;
        }
        .toy-name {
          font-size: 15px;
          font-weight: 700;
          color: white;
          margin: 0 0 4px 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .toy-desc {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          margin: 0 0 6px 0;
        }
        .seller-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
        }
        .seller-label {
          color: rgba(255, 255, 255, 0.4);
        }
        .seller-name {
          color: rgba(255, 255, 255, 0.9);
        }
        .seller-stars {
          color: #fbbf24;
          background: rgba(251, 191, 36, 0.1);
          padding: 1px 5px;
          border-radius: 4px;
        }
        .price-breakdown {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 14px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .price-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
        }
        .price-row.highlight {
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .row-label {
          color: rgba(255, 255, 255, 0.6);
        }
        .fiat-value {
          font-weight: 600;
          color: white;
        }
        .ckb-value {
          font-size: 16px;
          font-weight: 800;
          color: #00ff87;
        }
        .method-selection {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .section-label {
          font-size: 12px;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.7);
        }
        .method-options {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .method-btn {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
        }
        .method-btn:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .method-btn.active {
          border-color: #00ff87;
          background: rgba(0, 255, 135, 0.08);
        }
        .btn-icon {
          font-size: 20px;
        }
        .btn-text strong {
          display: block;
          font-size: 13px;
          color: white;
        }
        .btn-text small {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.5);
        }
        .escrow-notice {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: rgba(0, 255, 135, 0.05);
          border: 1px solid rgba(0, 255, 135, 0.15);
          border-radius: 12px;
          padding: 12px 14px;
        }
        .notice-icon {
          font-size: 16px;
        }
        .notice-text {
          font-size: 12px;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.75);
          margin: 0;
        }
        .error-alert {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #fca5a5;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 12px;
        }
        .modal-footer {
          padding: 16px 24px;
          background: rgba(255, 255, 255, 0.02);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }
        .cancel-btn {
          padding: 10px 18px;
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.7);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .cancel-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.08);
          color: white;
        }
        .confirm-btn {
          padding: 10px 22px;
          background: #00ff87;
          border: none;
          border-radius: 10px;
          color: black;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 255, 135, 0.3);
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
        }
        .confirm-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(0, 255, 135, 0.4);
        }
        .confirm-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
