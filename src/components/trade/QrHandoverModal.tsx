"use client";

import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useUser } from "@/lib/UserContext";
import { QRCodeSVG } from "qrcode.react";
import TradeRatingModal from "@/components/trade/TradeRatingModal";

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
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"SHOW_QR" | "SCAN_QR">("SHOW_QR");
  const [paymentMode, setPaymentMode] = useState<"FIBER" | "CKB_L1">("FIBER");
  const [isFallbackActive, setIsFallbackActive] = useState(false);

  // Review & Rating Modal states
  const [showRatingModal, setShowRatingModal] = useState(false);

  // Fiber invoice & L1 token states
  const [fiberData, setFiberData] = useState<any>(null);
  const [tokenData, setTokenData] = useState<any>(null);
  const [inputCode, setInputCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cancellation & Rejection states
  const [tradeStatus, setTradeStatus] = useState<string>("ESCROW_FUNDED");
  const [cancelReason, setCancelReason] = useState<string | null>(null);
  const [cancelRequestedBy, setCancelRequestedBy] = useState<string | null>(null);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState<string>("");
  const [customRejectReason, setCustomRejectReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [showConfirmReleaseDialog, setShowConfirmReleaseDialog] = useState(false);

  // Camera Scanner states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scanSuccessBadge, setScanSuccessBadge] = useState(false);
  const scannerRef = useRef<any>(null);

  // Stop camera helper
  const stopCamera = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn("Error stopping camera scanner:", err);
      }
      scannerRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Lifecycle cleanup when modal closes or active tab changes
  useEffect(() => {
    if (!isOpen || activeTab !== "SCAN_QR") {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (!isOpen || !tradeId) return;
    setMessage(null);
    setError(null);
    setCameraError(null);
    setScanSuccessBadge(false);
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
          // Trigger fallback to Standard Handover (L1)
          setIsFallbackActive(true);
          setPaymentMode("CKB_L1");
          await loadL1Token();
        }
      } catch (err) {
        console.warn("Fiber invoice init failed, falling back to L1:", err);
        setIsFallbackActive(true);
        setPaymentMode("CKB_L1");
        await loadL1Token();
      }
    }

    async function loadL1Token() {
      try {
        const callerParam = user?.joyIdAddress ? `?callerAddress=${encodeURIComponent(user.joyIdAddress)}` : "";
        const res = await fetch(`/api/trades/${tradeId}/qr${callerParam}`);
        const data = await res.json();
        if (res.ok) {
          setTokenData(data);
          if (data.status) setTradeStatus(data.status);
          if (data.cancelReason) setCancelReason(data.cancelReason);
          if (data.cancelRequestedBy) setCancelRequestedBy(data.cancelRequestedBy);

          // If cancellation requested, switch seller to SHOW_QR to review request
          if (data.status === "CANCEL_REQUESTED") {
            if (user?.joyIdAddress && data.sellerAddress === user.joyIdAddress) {
              setActiveTab("SHOW_QR");
            }
          } else {
            // Default tabs by role
            if (user?.joyIdAddress && data.buyerAddress === user.joyIdAddress) {
              setActiveTab("SCAN_QR");
            } else if (user?.joyIdAddress && data.sellerAddress === user.joyIdAddress) {
              setActiveTab("SHOW_QR");
            }
          }
        } else {
          setError(data.error || t("noActiveTradeFound"));
        }
      } catch (err: any) {
        console.error("Failed to load L1 token:", err);
        setError(t("noActiveTradeFound"));
      }
    }

    loadHandoverData();
  }, [isOpen, tradeId, user?.joyIdAddress]);

  // Cancellation & Rejection handlers
  const handleRequestCancel = async () => {
    const reasonToSubmit = selectedRejectReason || customRejectReason || t("reasonNotAsDescribed");
    setCancelLoading(true);
    setError(null);
    try {
      const actualTradeId = tokenData?.tradeId || fiberData?.tradeId || tradeId;
      const res = await fetch(`/api/trades/${actualTradeId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REQUEST_CANCEL",
          actorType: "BUYER",
          reason: reasonToSubmit,
          callerAddress: user?.joyIdAddress,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTradeStatus("CANCEL_REQUESTED");
        setCancelReason(reasonToSubmit);
        setCancelRequestedBy("BUYER");
        setShowRejectForm(false);
        setMessage(t("cancelRequestedNotice"));
      } else {
        setError(data.error || "Failed to request cancellation");
      }
    } catch (err: any) {
      setError(err.message || "Failed to request cancellation");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleConfirmRefund = async () => {
    setCancelLoading(true);
    setError(null);
    try {
      const actualTradeId = tokenData?.tradeId || fiberData?.tradeId || tradeId;
      const res = await fetch(`/api/trades/${actualTradeId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CONFIRM_CANCEL",
          actorType: "SELLER",
          callerAddress: user?.joyIdAddress,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTradeStatus("CANCELLED");
        setMessage(t("tradeCancelledSuccess"));
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500);
        }
      } else {
        setError(data.error || "Failed to confirm refund");
      }
    } catch (err: any) {
      setError(err.message || "Failed to confirm refund");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleDispute = async () => {
    setCancelLoading(true);
    setError(null);
    try {
      const actualTradeId = tokenData?.tradeId || fiberData?.tradeId || tradeId;
      const res = await fetch(`/api/trades/${actualTradeId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DISPUTE",
          actorType: "SELLER",
          callerAddress: user?.joyIdAddress,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTradeStatus("DISPUTED");
        setMessage(t("tradeDisputedNotice"));
      } else {
        setError(data.error || "Failed to mark dispute");
      }
    } catch (err: any) {
      setError(err.message || "Failed to mark dispute");
    } finally {
      setCancelLoading(false);
    }
  };

  // Launch live camera scanner
  const startCamera = async () => {
    setCameraError(null);
    setScanSuccessBadge(false);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");

      await stopCamera();
      setIsCameraActive(true);

      // Allow DOM container to mount before attaching scanner
      setTimeout(async () => {
        try {
          const viewportEl = document.getElementById("qr-camera-viewport");
          if (!viewportEl) return;

          const scanner = new Html5Qrcode("qr-camera-viewport");
          scannerRef.current = scanner;

          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: { width: 220, height: 220 },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              // Successfully decoded QR code
              let token = decodedText.trim();
              try {
                if (token.includes("token=")) {
                  const url = new URL(token);
                  const parsed = url.searchParams.get("token");
                  if (parsed) token = parsed;
                }
              } catch {
                // use raw text
              }

              setInputCode(token);
              setScanSuccessBadge(true);
              stopCamera();
            },
            () => {
              // Ignore frame-by-frame parse misses
            }
          );
        } catch (err: any) {
          console.error("Failed to start camera viewport:", err);
          setIsCameraActive(false);
          setCameraError(t("cameraPermissionDenied") || err.message || "Camera access failed");
        }
      }, 150);
    } catch (err: any) {
      setIsCameraActive(false);
      setCameraError(t("cameraPermissionDenied") || err.message || "Failed to initialize camera");
    }
  };

  async function handleVerifyScan(e: React.FormEvent) {
    e.preventDefault();
    if (!inputCode || !inputCode.trim()) return;
    // Guard against accidental release: trigger confirmation dialog
    setShowConfirmReleaseDialog(true);
  }

  async function executeSettlement() {
    setShowConfirmReleaseDialog(false);
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
            callerAddress: user?.joyIdAddress || tokenData?.buyerAddress,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          setMessage(t("handoverSuccess"));
          setTradeStatus("COMPLETED");
          setTimeout(() => setShowRatingModal(true), 1200);
          if (onSuccess) onSuccess();
        } else {
          setError(data.error || "Fiber payment verification failed");
        }
      } else {
        // Settle standard L1 token - Buyer submits confirmation releasing escrow
        const res = await fetch(`/api/trades/${tradeId}/qr`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: inputCode,
            buyerAddress: user?.joyIdAddress || tokenData?.buyerAddress,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setMessage(data.message || t("handoverSuccess"));
          setTradeStatus("COMPLETED");
          setTimeout(() => setShowRatingModal(true), 1200);
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

  const currentDisplayCode = error
    ? null
    : paymentMode === "FIBER"
      ? fiberData?.invoice || "Loading Fiber Invoice..."
      : tokenData?.token || "Generating Handover Token...";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-title-group">
            <h2>{t("handoverTitle")}</h2>
            <span className={`engine-badge ${paymentMode === "FIBER" ? "fiber" : "ckb"}`}>
              {paymentMode === "FIBER" ? t("instantHandover") : t("standardHandover")}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {isFallbackActive && (
          <div className="alert warning fallback-alert">
            <span className="fallback-icon">⚡→🔒</span>
            <span>{t("switchingToFallback")}</span>
          </div>
        )}

        {/* Counterparty Identity Card */}
        {tokenData && (
          <div className="mx-6 mt-3 p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30">
                {(tokenData.sellerName || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-[10px] text-white/50 uppercase font-semibold">{t("sellerRole")}</div>
                <div className="text-white font-medium truncate max-w-[120px]">
                  {tokenData.sellerName || "Seller"}
                </div>
              </div>
            </div>

            <div className="text-white/30 font-bold text-sm">⇄</div>

            <div className="flex items-center gap-2 text-right">
              <div>
                <div className="text-[10px] text-white/50 uppercase font-semibold">{t("buyerRole")}</div>
                <div className="text-white font-medium truncate max-w-[120px]">
                  {tokenData.buyerName || "Buyer"}
                </div>
              </div>
              <div className="w-7 h-7 rounded-full bg-[#00ff87]/20 text-[#00ff87] font-bold flex items-center justify-center border border-[#00ff87]/30">
                {(tokenData.buyerName || "B").charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Role-Specific Header or Demo Tabs */}
        {user && tokenData && (user.id === tokenData.sellerId || user.joyIdAddress === tokenData.sellerAddress) ? (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300 flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <span>🛡️</span> {t("sellerRoleBadge") || "Seller Handover View"}
            </span>
            <span className="text-white/60 text-[11px]">
              {t("sellerMeetupHint") || "Present this QR to the buyer once they inspect the toy."}
            </span>
          </div>
        ) : user && tokenData && (user.id === tokenData.buyerId || user.joyIdAddress === tokenData.buyerAddress) ? (
          <div className="p-3 bg-[#00ff87]/10 border-b border-[#00ff87]/20 text-xs text-[#00ff87] flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <span>📱</span> {t("buyerRoleBadge") || "Buyer Verification View"}
            </span>
            <span className="text-white/60 text-[11px]">
              {t("buyerMeetupHint") || "Inspect toy in person before scanning QR or confirming."}
            </span>
          </div>
        ) : (
          <div className="modal-tabs">
            <button
              className={`tab ${activeTab === "SHOW_QR" ? "active" : ""}`}
              onClick={() => setActiveTab("SHOW_QR")}
            >
              {t("sellerShowQr")}
            </button>
            <button
              className={`tab ${activeTab === "SCAN_QR" ? "active" : ""}`}
              onClick={() => setActiveTab("SCAN_QR")}
            >
              {t("buyerScanVerify")}
            </button>
          </div>
        )}

        <div className="modal-body">
          {error && !currentDisplayCode ? (
            <div className="error-container">
              <div className="alert error">{error}</div>
              <p className="hint mt-3">{t("noActiveTradeFound")}</p>
            </div>
          ) : activeTab === "SHOW_QR" ? (
            <div className="qr-container">
              {tradeStatus === "CANCEL_REQUESTED" && (
                <div className="seller-cancel-card">
                  <div className="seller-cancel-header">
                    <span className="warning-pill">{t("sellerCancelPrompt")}</span>
                    <p className="cancel-reason-quote">
                      "{cancelReason || t("reasonNotAsDescribed")}"
                    </p>
                  </div>
                  <p className="possession-question">
                    {t("sellerPossessionQuestion")}
                  </p>
                  <div className="seller-cancel-actions">
                    <button
                      type="button"
                      className="btn-confirm-refund"
                      onClick={handleConfirmRefund}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? "Processing..." : t("confirmPossessionRefundBtn")}
                    </button>
                    <button
                      type="button"
                      className="btn-dispute"
                      onClick={handleDispute}
                      disabled={cancelLoading}
                    >
                      {t("disputeBtn")}
                    </button>
                  </div>
                </div>
              )}

              {tradeStatus === "CANCELLED" && (
                <div className="alert success mb-3 w-full text-center">
                  {t("tradeCancelledSuccess")}
                </div>
              )}

              <p className="hint">
                {paymentMode === "FIBER"
                  ? t("instantHandoverHint")
                  : t("standardHandoverHint")}
              </p>

              <div className="qr-box">
                {currentDisplayCode &&
                !currentDisplayCode.startsWith("Loading") &&
                !currentDisplayCode.startsWith("Generating") ? (
                  <QRCodeSVG
                    value={currentDisplayCode}
                    size={200}
                    level="M"
                    includeMargin={true}
                    bgColor="#ffffff"
                    fgColor="#0a0a0a"
                    className="real-qr-code"
                  />
                ) : (
                  <div className="qr-loading-placeholder">
                    <span className="spinner"></span>
                    <span className="loading-text">
                      {paymentMode === "FIBER" ? "Generating Invoice..." : "Generating Token..."}
                    </span>
                  </div>
                )}
              </div>

              <div className="token-display">
                <span className="label">
                  {paymentMode === "FIBER" ? t("invoiceLabel") : t("tokenLabel")}
                </span>
                <span className="token-code">{currentDisplayCode}</span>
              </div>
              <span className="expiry">{t("expiryHint")}</span>
            </div>
          ) : (
            <form onSubmit={handleVerifyScan} className="scan-container">
              {tradeStatus === "CANCEL_REQUESTED" && (
                <div className="alert warning w-full">
                  <p className="font-bold">{t("cancelRequestedNotice")}</p>
                  {cancelReason && <p className="text-xs mt-1">"{cancelReason}"</p>}
                </div>
              )}

              {tradeStatus === "CANCELLED" && (
                <div className="alert success w-full text-center font-bold">
                  {t("tradeCancelledSuccess")}
                </div>
              )}

              {tradeStatus === "DISPUTED" && (
                <div className="alert error w-full text-center">
                  {t("tradeDisputedNotice")}
                </div>
              )}

              <p className="hint">
                {paymentMode === "FIBER"
                  ? "Scan or enter the Seller's Fiber Invoice to settle payment upon inspection."
                  : "Scan or enter the Seller's Handover Token to confirm inspection and release CKB escrow."}
              </p>

              {/* Camera Scanner Section */}
              <div className="camera-section">
                {isCameraActive ? (
                  <div className="camera-viewport-card">
                    <div id="qr-camera-viewport" className="camera-viewport"></div>
                    <p className="camera-scanning-hint">{t("cameraScanningHint")}</p>
                    <button
                      type="button"
                      className="camera-action-btn stop"
                      onClick={stopCamera}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      </svg>
                      {t("stopCamera")}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="camera-action-btn start"
                    onClick={startCamera}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                      <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                    {t("startCamera")}
                  </button>
                )}

                {cameraError && (
                  <div className="alert error camera-alert">
                    {cameraError}
                  </div>
                )}

                {scanSuccessBadge && (
                  <div className="alert success scan-badge">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                    {t("codeDetected")}
                  </div>
                )}
              </div>

              <div className="divider-line">
                <span>{t("manualEntryFallback")}</span>
              </div>

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
                    paymentMode === "FIBER" ? "fbr_invoice_..." : "QR_HANDOVER_..."
                  }
                  required
                />
              </div>

              {error && <div className="alert error">{error}</div>}
              {message && <div className="alert success">{message}</div>}

              {/* Pre-Settlement Confirmation Modal */}
              {showConfirmReleaseDialog && (
                <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <span>⚠️</span>
                    <span>Confirm Escrow Fund Release</span>
                  </div>
                  <p className="text-white/80 text-xs leading-relaxed">
                    Have you physically inspected and received the toy? Releasing escrow transfers funds to the seller immediately and cannot be undone.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="flex-1 py-2 px-3 rounded-lg bg-[#00ff87] text-black font-bold text-xs hover:opacity-90 transition-opacity"
                      onClick={executeSettlement}
                      disabled={loading}
                    >
                      {loading ? "Releasing..." : "Yes, Release Escrow"}
                    </button>
                    <button
                      type="button"
                      className="py-2 px-3 rounded-lg border border-white/20 bg-white/5 text-white/80 text-xs hover:bg-white/10 transition-colors"
                      onClick={() => setShowConfirmReleaseDialog(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading || tradeStatus === "CANCELLED"}>
                {loading ? t("verifying") : t("verifyAndComplete")}
              </button>

              {/* Reject Toy / Request Refund Option for Buyer */}
              {tradeStatus !== "CANCEL_REQUESTED" && tradeStatus !== "CANCELLED" && (
                <div className="reject-toy-section">
                  {!showRejectForm ? (
                    <button
                      type="button"
                      className="btn-open-reject"
                      onClick={() => {
                        setShowRejectForm(true);
                        setSelectedRejectReason(t("reasonDamaged"));
                      }}
                    >
                      <span className="reject-icon">✕</span>
                      <span>{t("rejectToyBtn")}</span>
                    </button>
                  ) : (
                    <div className="reject-form-card">
                      <div className="reject-form-header">
                        <span className="reject-title">{t("rejectReasonPrompt")}</span>
                        <button
                          type="button"
                          className="close-reject-btn"
                          onClick={() => setShowRejectForm(false)}
                        >
                          &times;
                        </button>
                      </div>

                      <div className="reason-options">
                        {[
                          { key: "reasonDamaged", label: t("reasonDamaged") },
                          { key: "reasonNotAsDescribed", label: t("reasonNotAsDescribed") },
                          { key: "reasonCounterfeit", label: t("reasonCounterfeit") },
                          { key: "reasonChangedMind", label: t("reasonChangedMind") },
                        ].map((opt) => (
                          <label key={opt.key} className="reason-option-label">
                            <input
                              type="radio"
                              name="rejectReasonRadio"
                              checked={selectedRejectReason === opt.label}
                              onChange={() => setSelectedRejectReason(opt.label)}
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="btn-submit-reject"
                        onClick={handleRequestCancel}
                        disabled={cancelLoading}
                      >
                        {cancelLoading ? "Submitting..." : t("sendCancelRequest")}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          )}

          <div className="modal-footer-brand">
            <span>Powered by Fiber Network & CKB</span>
          </div>
        </div>
      </div>

      {/* Post-Trade Mutual Rating Modal */}
      <TradeRatingModal
        tradeId={tokenData?.tradeId || tradeId}
        isOpen={showRatingModal}
        counterpartyName={
          user?.joyIdAddress === tokenData?.buyerAddress
            ? tokenData?.sellerName
            : tokenData?.buyerName
        }
        counterpartyRole={
          user?.joyIdAddress === tokenData?.buyerAddress ? "Seller" : "Buyer"
        }
        onClose={() => setShowRatingModal(false)}
        onSuccess={() => {
          setShowRatingModal(false);
          if (onSuccess) onSuccess();
        }}
      />

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
          max-height: 90vh;
          overflow-y: auto;
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
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }
        .engine-badge.fiber {
          background: rgba(255, 177, 0, 0.15);
          color: #ffb100;
          border: 1px solid rgba(255, 177, 0, 0.3);
        }
        .engine-badge.ckb {
          background: rgba(0, 255, 135, 0.15);
          color: #00ff87;
          border: 1px solid rgba(0, 255, 135, 0.3);
        }
        .close-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.5rem;
          cursor: pointer;
          line-height: 1;
        }
        .close-btn:hover {
          color: #ffffff;
        }
        .fallback-alert {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          background: rgba(255, 177, 0, 0.12);
          border: 1px solid rgba(255, 177, 0, 0.3);
          color: #ffcf56;
          font-size: 0.8rem;
          padding: 8px 12px;
          border-radius: 8px;
        }
        .fallback-icon {
          font-size: 1rem;
        }
        .modal-tabs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-bottom: 20px;
          background: rgba(255, 255, 255, 0.05);
          padding: 4px;
          border-radius: 8px;
        }
        .tab {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          padding: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab.active {
          background: #202020;
          color: #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .hint {
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 16px;
          line-height: 1.4;
          text-align: center;
        }
        .qr-container {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .qr-box {
          background: #ffffff;
          border-radius: 16px;
          padding: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        }
        .qr-loading-placeholder {
          width: 200px;
          height: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(0, 0, 0, 0.1);
          border-top-color: #0a0a0a;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .loading-text {
          font-size: 0.8rem;
          color: #333333;
          font-weight: 600;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
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
          letter-spacing: 0.05em;
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
          gap: 14px;
        }
        .camera-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        .camera-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .camera-action-btn.start {
          background: rgba(96, 239, 255, 0.15);
          border: 1px solid rgba(96, 239, 255, 0.4);
          color: #60efff;
        }
        .camera-action-btn.start:hover {
          background: rgba(96, 239, 255, 0.25);
        }
        .camera-action-btn.stop {
          background: rgba(255, 71, 87, 0.15);
          border: 1px solid rgba(255, 71, 87, 0.4);
          color: #ff4757;
          margin-top: 10px;
        }
        .camera-viewport-card {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #000000;
          border: 1px solid rgba(96, 239, 255, 0.3);
          border-radius: 12px;
          padding: 12px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
        }
        .camera-viewport {
          width: 100% !important;
          max-width: 280px;
          border-radius: 8px;
          overflow: hidden;
        }
        .camera-scanning-hint {
          font-size: 0.78rem;
          color: rgba(255, 255, 255, 0.7);
          margin-top: 8px;
          text-align: center;
        }
        .camera-alert {
          width: 100%;
          margin-top: 10px;
        }
        .scan-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          width: 100%;
          margin-top: 10px;
          font-weight: 600;
        }
        .divider-line {
          display: flex;
          align-items: center;
          text-align: center;
          margin: 6px 0;
        }
        .divider-line::before,
        .divider-line::after {
          content: "";
          flex: 1;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        .divider-line span {
          padding: 0 10px;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.4);
          text-transform: uppercase;
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
        input:focus {
          outline: none;
          border-color: #60efff;
        }
        .quick-fill-btn {
          background: rgba(96, 239, 255, 0.1);
          border: 1px dashed rgba(96, 239, 255, 0.4);
          color: #60efff;
          padding: 8px;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .quick-fill-btn:hover {
          background: rgba(96, 239, 255, 0.2);
        }
        .alert {
          padding: 10px;
          border-radius: 6px;
          font-size: 0.85rem;
        }
        .alert.error {
          background: rgba(255, 71, 87, 0.15);
          color: #ff4757;
          border: 1px solid rgba(255, 71, 87, 0.3);
        }
        .alert.success {
          background: rgba(0, 255, 135, 0.15);
          color: #00ff87;
          border: 1px solid rgba(0, 255, 135, 0.3);
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
          transition: transform 0.1s, opacity 0.2s;
        }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .seller-cancel-card {
          width: 100%;
          background: rgba(255, 71, 87, 0.08);
          border: 1px solid rgba(255, 71, 87, 0.35);
          border-radius: 12px;
          padding: 14px;
          margin-bottom: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .seller-cancel-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .warning-pill {
          font-size: 0.72rem;
          font-weight: 700;
          color: #ff6b81;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .cancel-reason-quote {
          font-size: 0.88rem;
          font-style: italic;
          color: #ffffff;
          margin: 0;
        }
        .possession-question {
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.8);
          margin: 0;
          line-height: 1.3;
        }
        .seller-cancel-actions {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          margin-top: 4px;
        }
        .btn-confirm-refund {
          background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
          border: none;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-confirm-refund:hover:not(:disabled) {
          opacity: 0.9;
        }
        .btn-dispute {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          font-size: 0.8rem;
          padding: 10px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-dispute:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
        }
        .reject-toy-section {
          width: 100%;
          margin-top: 6px;
        }
        .btn-open-reject {
          width: 100%;
          background: transparent;
          border: 1px dashed rgba(255, 71, 87, 0.4);
          color: #ff6b81;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s;
        }
        .btn-open-reject:hover {
          background: rgba(255, 71, 87, 0.1);
        }
        .reject-icon {
          font-size: 0.8rem;
          font-weight: bold;
        }
        .reject-form-card {
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 71, 87, 0.3);
          border-radius: 12px;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .reject-form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .reject-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #ff6b81;
          text-transform: uppercase;
        }
        .close-reject-btn {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.2rem;
          cursor: pointer;
          line-height: 1;
        }
        .reason-options {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .reason-option-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: rgba(255, 255, 255, 0.85);
          cursor: pointer;
          padding: 6px 8px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.03);
          transition: background 0.2s;
        }
        .reason-option-label:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .btn-submit-reject {
          background: #ff4757;
          border: none;
          color: #ffffff;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        .btn-submit-reject:hover:not(:disabled) {
          opacity: 0.9;
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
