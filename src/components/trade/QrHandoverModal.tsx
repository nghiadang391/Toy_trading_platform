"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/LanguageContext";

interface QrHandoverModalProps {
  tradeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QrHandoverModal({
  tradeId,
  isOpen,
  onClose,
  onSuccess,
}: QrHandoverModalProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<"SHOW_QR" | "SCAN_QR">("SHOW_QR");
  const [paymentMode, setPaymentMode] = useState<"FIBER" | "CKB_L1">("FIBER");
  const [isFallbackActive, setIsFallbackActive] = useState(false);

  // Fiber invoice & L1 token states
  const [fiberData, setFiberData] = useState<any>(null);
  const [tokenData, setTokenData] = useState<any>(null);
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !tradeId) return;
    setMessage(null);
    setError(null);
    setIsFallbackActive(false);
    setPaymentMode("FIBER");

    // Primary: Attempt Instant Handover via Fiber
    async function loadHandoverData() {
      try {
        const res = await fetch("/api/fiber/invoice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tradeId }),
        });
        const data = await res.json();

        if (res.ok && data.success && !data.useFallback) {
          setFiberData(data);
          setPaymentMode("FIBER");
        } else {
          // Trigger smooth fallback to Standard Handover (L1)
          setIsFallbackActive(true);
          setPaymentMode("CKB_L1");
          loadL1Token();
        }
      } catch (err) {
        console.warn("Fiber invoice init failed, falling back to L1:", err);
        setIsFallbackActive(true);
        setPaymentMode("CKB_L1");
        loadL1Token();
      }
    }

    async function loadL1Token() {
      try {
        const res = await fetch(`/api/trades/${tradeId}/qr`);
        const data = await res.json();
        if (res.ok) {
          setTokenData(data);
        }
      } catch (err) {
        console.error("Failed to load L1 token:", err);
      }
    }

    loadHandoverData();
  }, [isOpen, tradeId]);

  async function handleVerifyScan(e: React.FormEvent) {
    e.preventDefault();
    if (!inputCode) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (paymentMode === "FIBER") {
        // Settle Fiber payment
        const res = await fetch("/api/fiber/pay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tradeId,
            invoice: inputCode,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setMessage(t("handoverSuccess"));
          if (onSuccess) onSuccess();
        } else {
          setError(data.error || "Fiber payment verification failed");
        }
      } else {
        // Settle standard L1 token
        const res = await fetch(`/api/trades/${tradeId}/qr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: inputCode,
            sellerAddress: "0xdummyjoyidaddressfrompasskeysignin",
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setMessage(data.message || t("handoverSuccess"));
          if (onSuccess) onSuccess();
        } else {
          setError(data.error || "Verification failed");
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to process verification");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const currentDisplayCode =
    paymentMode === "FIBER"
      ? fiberData?.invoice || "Loading Fiber Invoice..."
      : tokenData?.token || "Generating Token...";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title-group">
            <h2>{t("handoverTitle")}</h2>
            <span className={`engine-badge ${paymentMode}`}>
              {paymentMode === "FIBER"
                ? t("instantHandover")
                : t("standardHandover")}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Fallback Notice Banner */}
        {isFallbackActive && (
          <div className="fallback-banner">
            <p>{t("switchingToFallback")}</p>
          </div>
        )}

        <div className="tabs">
          <button
            className={`tab ${activeTab === "SHOW_QR" ? "active" : ""}`}
            onClick={() => setActiveTab("SHOW_QR")}
          >
            {t("buyerShowQr")}
          </button>
          <button
            className={`tab ${activeTab === "SCAN_QR" ? "active" : ""}`}
            onClick={() => setActiveTab("SCAN_QR")}
          >
            {t("sellerScanVerify")}
          </button>
        </div>

        <div className="modal-body">
          {activeTab === "SHOW_QR" ? (
            <div className="qr-container">
              <p className="hint">
                {paymentMode === "FIBER"
                  ? t("instantHandoverHint")
                  : t("standardHandoverHint")}
              </p>

              <div className="qr-box">
                <div className="qr-code-graphic">
                  <div className="qr-corner top-left"></div>
                  <div className="qr-corner top-right"></div>
                  <div className="qr-corner bottom-left"></div>
                  <span className="qr-center-text">
                    {paymentMode === "FIBER" ? "FIBER" : "CKB"}
                  </span>
                </div>
              </div>

              <div className="token-display">
                <span className="label">
                  {paymentMode === "FIBER"
                    ? t("invoiceLabel")
                    : t("tokenLabel")}
                </span>
                <span className="token-code">{currentDisplayCode}</span>
              </div>
              <span className="expiry">{t("expiryHint")}</span>
            </div>
          ) : (
            <form onSubmit={handleVerifyScan} className="scan-container">
              <p className="hint">
                {paymentMode === "FIBER"
                  ? "Scan or enter the Buyer's Fiber Invoice to settle instantly."
                  : "Scan or enter the Buyer's Handover Token to confirm delivery."}
              </p>

              <div className="form-group">
                <label htmlFor="codeScanInput">
                  {paymentMode === "FIBER" ? t("invoiceLabel") : t("tokenLabel")}
                </label>
                <input
                  type="text"
                  id="codeScanInput"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder={
                    paymentMode === "FIBER"
                      ? "fbr_invoice_..."
                      : "QR_HANDOVER_..."
                  }
                  required
                />
              </div>

              {currentDisplayCode && !currentDisplayCode.startsWith("Loading") && !currentDisplayCode.startsWith("Generating") && (
                <button
                  type="button"
                  className="quick-fill-btn"
                  onClick={() => setInputCode(currentDisplayCode)}
                >
                  Auto-fill Active Code (Demo Mode)
                </button>
              )}

              {error && <div className="alert error">{error}</div>}
              {message && <div className="alert success">{message}</div>}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? t("verifying") : t("verifyAndComplete")}
              </button>
            </form>
          )}

          <div className="modal-footer-brand">
            <span>Powered by Fiber Network & CKB</span>
          </div>
        </div>
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
          z-index: 200;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-content {
          background: #121212;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          color: #ffffff;
          padding: 24px;
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .header-title-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        h2 {
          font-size: 1.25rem;
          font-weight: 700;
          margin: 0;
        }
        .engine-badge {
          font-size: 0.72rem;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .engine-badge.FIBER {
          background: rgba(0, 255, 135, 0.15);
          color: #00ff87;
          border: 1px solid rgba(0, 255, 135, 0.3);
        }
        .engine-badge.CKB_L1 {
          background: rgba(96, 239, 255, 0.15);
          color: #60efff;
          border: 1px solid rgba(96, 239, 255, 0.3);
        }
        .fallback-banner {
          background: rgba(255, 193, 7, 0.12);
          border: 1px solid rgba(255, 193, 7, 0.3);
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 16px;
        }
        .fallback-banner p {
          margin: 0;
          font-size: 0.8rem;
          line-height: 1.4;
          color: #ffc107;
        }
        .close-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 1.25rem;
          cursor: pointer;
        }
        .tabs {
          display: flex;
          gap: 8px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .tab {
          flex: 1;
          padding: 8px;
          border: none;
          background: none;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab.active {
          background: #00ff87;
          color: #0a0a0a;
        }
        .hint {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 20px;
          line-height: 1.4;
          text-align: center;
        }
        .qr-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .qr-box {
          width: 180px;
          height: 180px;
          background: #ffffff;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .qr-code-graphic {
          width: 100%;
          height: 100%;
          border: 4px dashed #0a0a0a;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .qr-corner {
          position: absolute;
          width: 28px;
          height: 28px;
          background: #0a0a0a;
        }
        .top-left { top: 4px; left: 4px; }
        .top-right { top: 4px; right: 4px; }
        .bottom-left { bottom: 4px; left: 4px; }
        .qr-center-text {
          font-weight: 900;
          color: #0a0a0a;
          font-size: 1.1rem;
          letter-spacing: 0.05em;
        }
        .token-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          width: 100%;
          text-align: center;
        }
        .label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          text-transform: uppercase;
        }
        .token-code {
          font-family: monospace;
          font-size: 0.85rem;
          color: #60efff;
          font-weight: 700;
          word-break: break-all;
          max-width: 90%;
        }
        .expiry {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 6px;
        }
        .scan-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        label {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.7);
        }
        input {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 12px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 0.9rem;
        }
        .quick-fill-btn {
          background: rgba(96, 239, 255, 0.1);
          border: 1px dashed rgba(96, 239, 255, 0.4);
          color: #60efff;
          padding: 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
        }
        .alert {
          padding: 10px;
          border-radius: 6px;
          font-size: 0.85rem;
        }
        .alert.error {
          background: rgba(255, 71, 87, 0.15);
          color: #ff4757;
        }
        .alert.success {
          background: rgba(0, 255, 135, 0.15);
          color: #00ff87;
        }
        .submit-btn {
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          border: none;
          color: #0a0a0a;
          padding: 12px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.95rem;
        }
        .modal-footer-brand {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          text-align: center;
        }
        .modal-footer-brand span {
          font-size: 0.72rem;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.02em;
        }
      `}</style>
    </div>
  );
}
