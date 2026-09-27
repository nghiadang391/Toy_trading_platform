"use client";

import React, { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { useUser } from "@/lib/UserContext";

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
  const { user, updateProfile } = useUser();
  const { t } = useLanguage();

  const [name, setName] = useState(user?.displayName || "");
  const [region, setRegion] = useState<"UK" | "VIETNAM">(user?.region || "UK");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length < 2) {
      setFeedback({ type: "error", text: "Display name must be at least 2 characters." });
      return;
    }

    setSaving(true);
    setFeedback(null);

    const result = await updateProfile(name.trim(), region);
    setSaving(false);

    if (result.success) {
      setFeedback({ type: "success", text: t("profileUpdated") });
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setFeedback({ type: "error", text: result.error || "Failed to update profile. Please try again." });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#121417] p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00ff87] to-[#60efff] flex items-center justify-center text-black font-extrabold text-sm">
              {name.charAt(0).toUpperCase() || "U"}
            </div>
            <h2 className="text-lg font-bold text-white">{t("editProfile")}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-white/60 mb-1">
              JoyID Wallet Address (CKB)
            </label>
            <div className="rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-xs font-mono text-white/60 truncate">
              {user.joyIdAddress}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              {t("displayNameLabel")}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Vintage Toy Collector"
              maxLength={30}
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff87] transition-all"
            />
            <p className="text-[11px] text-white/40 mt-1">
              This name will be shown to buyers, sellers, and on your listings.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              {t("regionLabel")}
            </label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value as "UK" | "VIETNAM")}
              className="w-full rounded-lg bg-white/5 border border-white/15 px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00ff87] transition-all"
            >
              <option value="UK" className="bg-[#121417]">United Kingdom (GBP)</option>
              <option value="VIETNAM" className="bg-[#121417]">Vietnam (VND)</option>
            </select>
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
              className="flex-1 rounded-lg border border-white/15 py-2 text-sm font-semibold text-white/70 hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-gradient-to-r from-[#00ff87] to-[#60efff] py-2 text-sm font-bold text-black hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? t("savingProfile") : t("saveProfile")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
