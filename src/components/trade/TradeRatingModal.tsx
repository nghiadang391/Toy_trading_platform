"use client";

import React, { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useUser } from "@/lib/UserContext";

interface TradeRatingModalProps {
  tradeId: string;
  isOpen: boolean;
  counterpartyName?: string;
  counterpartyRole?: "Seller" | "Buyer";
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TradeRatingModal({
  tradeId,
  isOpen,
  counterpartyName,
  counterpartyRole = "Seller",
  onClose,
  onSuccess,
}: TradeRatingModalProps) {
  const { user } = useUser();
  const { t } = useLanguage();

  const [score, setScore] = useState<number>(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen || !tradeId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.joyIdAddress) {
      setFeedback({ type: "error", text: "Please connect your wallet first." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/trades/${tradeId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callerAddress: user.joyIdAddress,
          score,
          comment: comment.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFeedback({ type: "success", text: t("reviewSuccess") });
        window.dispatchEvent(new CustomEvent("toytrade:profileUpdated"));
        window.dispatchEvent(new CustomEvent("toytrade:notification"));
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setFeedback({ type: "error", text: data.error || "Failed to submit review" });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Network error submitting review" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121417] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">{t("leaveReview")}</h2>
            <p className="text-xs text-white/50">
              Rate your experience trading with{" "}
              <span className="text-white font-medium">
                {counterpartyName || counterpartyRole}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-2">
              {t("ratingScore")}
            </label>
            <div className="flex items-center gap-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setScore(star)}
                  className={`text-2xl transition-transform hover:scale-125 ${
                    star <= score ? "text-yellow-400" : "text-white/20"
                  }`}
                  aria-label={`${star} Stars`}
                >
                  ★
                </button>
              ))}
              <span className="text-xs font-bold text-white/70 ml-2">
                {score} / 5 Stars
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              {t("reviewComment")}
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("reviewCommentPlaceholder")}
              rows={3}
              maxLength={500}
              className="w-full rounded-lg bg-white/5 border border-white/15 p-3 text-sm text-white focus:outline-none focus:border-[#00ff87] transition-all resize-none"
            />
          </div>

          {feedback && (
            <div
              className={`p-2.5 rounded-lg text-xs font-medium ${
                feedback.type === "success"
                  ? "bg-[#00ff87]/15 border border-[#00ff87]/30 text-[#00ff87]"
                  : "bg-red-500/15 border border-red-500/30 text-red-400"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-white/15 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-gradient-to-r from-[#00ff87] to-[#60efff] py-2.5 text-sm font-bold text-black hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? t("submittingReview") : t("submitReview")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
