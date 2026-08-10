"use client";

import { useState, useEffect } from "react";

interface QrHandoverModalProps {
  tradeId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function QrHandoverModal({ tradeId, isOpen, onClose, onSuccess }: QrHandoverModalProps) {
  const [activeTab, setActiveTab] = useState<"SHOW_QR" | "SCAN_QR">("SHOW_QR");
  const [tokenData, setTokenData] = useState<any>(null);
  const [inputToken, setInputToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !tradeId) return;
    setMessage(null);
    setError(null);

    // Auto-generate QR Token for Buyer view
    async function generateToken() {
      try {
        const res = await fetch(`/api/trades/${tradeId}/qr`);
        const data = await res.json();
        if (res.ok) {
          setTokenData(data);
        }
      } catch (err) {
        console.error("Failed to generate QR token:", err);
      }
    }
    generateToken();
  }, [isOpen, tradeId]);

  async function handleVerifyScan(e: React.FormEvent) {
    e.preventDefault();
    if (!inputToken) return;

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/trades/${tradeId}/qr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: inputToken,
          sellerAddress: "0xdummyjoyidaddressfrompasskeysignin",
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage(data.message);
        if (onSuccess) onSuccess();
      } else {
        setError(data.error || "Verification failed");
      }
    } catch (err: any) {
      setError(err.message || "Failed to process QR scan verification");
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📱 Meetup QR Handover</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === "SHOW_QR" ? "active" : ""}`}
            onClick={() => setActiveTab("SHOW_QR")}
          >
            Buyer (Show QR)
          </button>
          <button
            className={`tab ${activeTab === "SCAN_QR" ? "active" : ""}`}
            onClick={() => setActiveTab("SCAN_QR")}
          >
            Seller (Scan/Verify)
          </button>
        </div>

        <div className="modal-body">
          {activeTab === "SHOW_QR" ? (
            <div className="qr-container">
              <p className="hint">
                Show this 1-time handover QR code to the seller at your meetup to complete CKB escrow.
              </p>

              <div className="qr-box">
                {/* SVG Mock QR Visual representation */}
                <div className="qr-code-graphic">
                  <div className="qr-corner top-left"></div>
                  <div className="qr-corner top-right"></div>
                  <div className="qr-corner bottom-left"></div>
                  <span className="qr-center-text">CKB</span>
                </div>
              </div>

              <div className="token-display">
                <span className="label">Handover Token:</span>
                <span className="token-code">{tokenData?.token || "Generating..."}</span>
              </div>
              <span className="expiry">Expires in 30 minutes</span>
            </div>
          ) : (
            <form onSubmit={handleVerifyScan} className="scan-container">
              <p className="hint">
                Scan or enter the Buyer's 1-time Handover Token to confirm physical delivery and trigger CKB payout.
              </p>

              <div className="form-group">
                <label htmlFor="qrTokenInput">Handover Token Code</label>
                <input
                  type="text"
                  id="qrTokenInput"
                  value={inputToken}
                  onChange={(e) => setInputToken(e.target.value)}
                  placeholder="e.g. QR_HANDOVER_A1B2C3D4"
                  required
                />
              </div>

              {tokenData?.token && (
                <button
                  type="button"
                  className="quick-fill-btn"
                  onClick={() => setInputToken(tokenData.token)}
                >
                  ⚡ Auto-fill Active Token (Demo Mode)
                </button>
              )}

              {error && <div className="alert error">{error}</div>}
              {message && <div className="alert success">{message}</div>}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Verifying CKB Escrow..." : "Confirm Handover & Release CKB"}
              </button>
            </form>
          )}
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
        h2 {
          font-size: 1.3rem;
          font-weight: 800;
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
          font-size: 1.2rem;
          letter-spacing: 0.1em;
        }
        .token-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .token-code {
          font-family: monospace;
          font-size: 1rem;
          color: #60efff;
          font-weight: 700;
        }
        .expiry {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 4px;
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
          font-size: 0.95rem;
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
        }
      `}</style>
    </div>
  );
}
