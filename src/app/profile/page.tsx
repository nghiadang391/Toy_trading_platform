"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";
import { useUser } from "@/lib/UserContext";
import UserProfileModal from "@/components/profile/UserProfileModal";
import ToyPassportModal from "@/components/passport/ToyPassportModal";
import QrHandoverModal from "@/components/trade/QrHandoverModal";

interface ProfileData {
  id: string;
  displayName: string;
  joyIdAddress: string;
  region: "UK" | "VIETNAM";
  avatarUrl: string | null;
  createdAt: string;
  averageRating: number | null;
  totalRatings: number;
  completedTradesCount: number;
  openListings: any[];
  soldListings: any[];
  completedTrades: any[];
  reviews: any[];
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const requestedUserId = searchParams.get("userId") || searchParams.get("id");
  const { user, connectWallet } = useUser();
  const { t } = useLanguage();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"OPEN" | "SOLD" | "REVIEWS">("OPEN");

  // Modal States
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPassportId, setSelectedPassportId] = useState<string | null>(null);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activeUserId = requestedUserId || user?.id || user?.joyIdAddress;
  const isOwnProfile = Boolean(
    user &&
      profile &&
      (user.id === profile.id || user.joyIdAddress === profile.joyIdAddress)
  );

  async function fetchProfile(idToFetch: string, isSilent = false) {
    try {
      if (!isSilent) {
        setLoading(true);
      }
      setError(null);
      const res = await fetch(`/api/users/${encodeURIComponent(idToFetch)}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
      } else {
        if (!isSilent) {
          setError(data.error || "User profile not found");
        }
      }
    } catch (err: any) {
      if (!isSilent) {
        setError("Failed to load user profile");
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }

  // Initial fetch on mount / user change
  useEffect(() => {
    if (activeUserId) {
      fetchProfile(activeUserId);
    } else {
      setLoading(false);
    }
  }, [activeUserId]);

  // Real-time background sync: periodic polling (8s), window focus/visibility, and live custom events
  useEffect(() => {
    if (!activeUserId) return;

    const interval = setInterval(() => {
      fetchProfile(activeUserId, true);
    }, 8000);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        fetchProfile(activeUserId, true);
      }
    };

    const handleLiveEvents = () => {
      fetchProfile(activeUserId, true);
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);
    window.addEventListener("toytrade:tradeUpdated", handleLiveEvents);
    window.addEventListener("toytrade:profileUpdated", handleLiveEvents);
    window.addEventListener("toytrade:notification", handleLiveEvents);
    window.addEventListener("toytrade:listingUpdated", handleLiveEvents);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      window.removeEventListener("toytrade:tradeUpdated", handleLiveEvents);
      window.removeEventListener("toytrade:profileUpdated", handleLiveEvents);
      window.removeEventListener("toytrade:notification", handleLiveEvents);
      window.removeEventListener("toytrade:listingUpdated", handleLiveEvents);
    };
  }, [activeUserId]);

  const copyAddress = () => {
    if (profile?.joyIdAddress) {
      navigator.clipboard.writeText(profile.joyIdAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!activeUserId && !loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="p-8 rounded-2xl border border-white/10 bg-white/5 max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#00ff87]/20 text-[#00ff87] flex items-center justify-center mx-auto text-xl font-bold">
            🔑
          </div>
          <h2 className="text-xl font-bold text-white">{t("connectWalletToViewProfile") || "Connect Your Passkey"}</h2>
          <p className="text-xs text-white/60">
            {t("connectPromptDesc") || "Please connect your JoyID Passkey wallet to view and manage your profile."}
          </p>
          <button
            onClick={() => connectWallet()}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#60efff] text-black font-bold text-sm hover:opacity-90 transition-opacity"
          >
            {t("fingerprintConnect") || "Connect Passkey"}
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-[#00ff87] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-white/50 mt-4">{t("loading") || "Loading profile..."}</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="p-8 rounded-2xl border border-red-500/20 bg-red-500/10 max-w-md mx-auto space-y-3">
          <h2 className="text-lg font-bold text-red-400">User Profile Error</h2>
          <p className="text-xs text-white/70">{error || "Could not load profile details"}</p>
          <Link
            href="/listings"
            className="inline-block text-xs text-[#00ff87] hover:underline pt-2 font-medium"
          >
            ← Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const shortAddress = `${profile.joyIdAddress.slice(0, 8)}...${profile.joyIdAddress.slice(-6)}`;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 font-sans space-y-8">
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#00ff87] to-[#60efff] text-black font-black text-2xl sm:text-3xl flex items-center justify-center shadow-lg shadow-[#00ff87]/20">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  {profile.displayName}
                </h1>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-white/10 border border-white/15 text-white/80">
                  {profile.region === "VIETNAM" ? "Vietnam" : "United Kingdom"}
                </span>
                {isOwnProfile && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#00ff87]/15 border border-[#00ff87]/30 text-[#00ff87]">
                    You
                  </span>
                )}
              </div>

              {/* JoyID Address Pill */}
              <button
                onClick={copyAddress}
                className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white bg-black/40 hover:bg-black/60 px-2.5 py-1 rounded-lg border border-white/10 transition-colors font-mono"
                title="Click to copy JoyID address"
              >
                <span>🔑 {shortAddress}</span>
                <span className="text-[10px] text-[#00ff87]">{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {isOwnProfile && (
              <button
                onClick={() => setEditModalOpen(true)}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-white/20 bg-white/10 hover:bg-white/15 text-xs font-semibold text-white transition-all"
              >
                ✎ Edit Profile
              </button>
            )}
            <Link
              href="/listings/create"
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-[#00ff87] to-[#60efff] text-black font-bold text-xs hover:opacity-90 transition-opacity text-center"
            >
              + Sell a Toy
            </Link>
          </div>
        </div>

        {/* Reputation Metrics Bar */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/10 text-center">
          <div className="space-y-0.5">
            <p className="text-xs text-white/40 font-medium">Reputation</p>
            <p className="text-lg font-bold text-yellow-400">
              {profile.averageRating ? `${profile.averageRating} / 5.0` : "New Trader"}
            </p>
            <p className="text-[10px] text-white/40">({profile.totalRatings} reviews)</p>
          </div>
          <div className="space-y-0.5 border-x border-white/10">
            <p className="text-xs text-white/40 font-medium">Toys Sold</p>
            <p className="text-lg font-bold text-[#00ff87]">{profile.completedTradesCount}</p>
            <p className="text-[10px] text-white/40">completed trades</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-white/40 font-medium">Open Selling</p>
            <p className="text-lg font-bold text-[#60efff]">{profile.openListings.length}</p>
            <p className="text-[10px] text-white/40">active listings</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setActiveTab("OPEN")}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === "OPEN"
              ? "border-[#00ff87] text-[#00ff87]"
              : "border-transparent text-white/50 hover:text-white"
          }`}
        >
          Open Selling Toys ({profile.openListings.length})
        </button>
        <button
          onClick={() => setActiveTab("SOLD")}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === "SOLD"
              ? "border-[#00ff87] text-[#00ff87]"
              : "border-transparent text-white/50 hover:text-white"
          }`}
        >
          Sold Toys ({profile.soldListings.length})
        </button>
        <button
          onClick={() => setActiveTab("REVIEWS")}
          className={`pb-3 px-4 text-sm font-semibold transition-all border-b-2 ${
            activeTab === "REVIEWS"
              ? "border-[#00ff87] text-[#00ff87]"
              : "border-transparent text-white/50 hover:text-white"
          }`}
        >
          Reviews & Ratings ({profile.reviews.length})
        </button>
      </div>

      {/* Tab 1: Open Selling Toys */}
      {activeTab === "OPEN" && (
        <div>
          {profile.openListings.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-white/10 bg-white/5 space-y-2">
              <p className="text-white/60 text-sm">No open selling toys currently listed.</p>
              {isOwnProfile && (
                <Link
                  href="/listings/create"
                  className="inline-block mt-2 text-xs text-[#00ff87] hover:underline font-bold"
                >
                  List a toy for sale →
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {profile.openListings.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col justify-between hover:border-white/20 transition-all"
                >
                  <div>
                    <div className="h-44 bg-black/40 relative overflow-hidden flex items-center justify-center">
                      {item.imageUrls?.[0] ? (
                        <img
                          src={item.imageUrls[0]}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl">🧸</span>
                      )}
                      <span
                        className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          item.status === "RESERVED"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-[#00ff87]/20 text-[#00ff87] border border-[#00ff87]/30"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <h3 className="font-bold text-white text-base truncate">{item.title}</h3>
                      <p className="text-xs text-white/50 line-clamp-2">{item.description}</p>
                      <div className="pt-2 flex items-baseline justify-between">
                        <span className="text-lg font-black text-white">
                          {item.currency === "VND" ? "₫" : "£"}
                          {Number(item.priceFiat).toLocaleString()}
                        </span>
                        <span className="text-xs text-white/40">{item.condition}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0 flex items-center gap-2">
                    <button
                      onClick={() => setSelectedPassportId(item.id)}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors"
                    >
                      Toy Passport
                    </button>
                    {item.status === "RESERVED" && item.trades?.[0]?.id && (
                      <button
                        onClick={() => setSelectedTradeId(item.trades[0].id)}
                        className="py-1.5 px-3 rounded-lg bg-[#00ff87] text-black text-xs font-bold hover:opacity-90 transition-opacity"
                        title="Open Handover Modal"
                      >
                        Handover
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Sold Toys */}
      {activeTab === "SOLD" && (
        <div>
          {profile.soldListings.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-white/10 bg-white/5 space-y-2">
              <p className="text-white/60 text-sm">No toys sold yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {profile.soldListings.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-white/5 overflow-hidden flex flex-col justify-between opacity-85 hover:opacity-100 transition-opacity"
                >
                  <div>
                    <div className="h-44 bg-black/40 relative overflow-hidden flex items-center justify-center">
                      {item.imageUrls?.[0] ? (
                        <img
                          src={item.imageUrls[0]}
                          alt={item.title}
                          className="w-full h-full object-cover grayscale-[30%]"
                        />
                      ) : (
                        <span className="text-4xl">🧸</span>
                      )}
                      <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/15 text-white/80 border border-white/20">
                        TRADED
                      </span>
                    </div>

                    <div className="p-4 space-y-1.5">
                      <h3 className="font-bold text-white text-base truncate">{item.title}</h3>
                      <div className="pt-2 flex items-baseline justify-between">
                        <span className="text-lg font-black text-white/80">
                          {item.currency === "VND" ? "₫" : "£"}
                          {Number(item.priceFiat).toLocaleString()}
                        </span>
                        <span className="text-xs text-[#00ff87] font-semibold">Completed</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-0">
                    <button
                      onClick={() => setSelectedPassportId(item.id)}
                      className="w-full py-1.5 px-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-medium transition-colors"
                    >
                      View Toy Passport
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Reviews & Ratings */}
      {activeTab === "REVIEWS" && (
        <div className="space-y-4">
          {profile.reviews.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-white/10 bg-white/5 space-y-2">
              <p className="text-white/60 text-sm">No reviews or ratings received yet.</p>
              <p className="text-xs text-white/40">Reviews appear here once buyers complete in-person handovers.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {profile.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-400 font-bold text-sm">
                        {"★".repeat(rev.score)}{"☆".repeat(5 - rev.score)}
                      </span>
                      <span className="text-xs font-bold text-white">
                        {rev.score}.0 / 5.0
                      </span>
                      <span className="text-xs text-white/40">by {rev.raterName}</span>
                    </div>
                    <span className="text-[11px] text-white/40">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-white/80 italic">"{rev.comment}"</p>
                  )}

                  {rev.toyTitle && (
                    <p className="text-[11px] text-white/40">
                      Item: <strong className="text-white/60">{rev.toyTitle}</strong>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Edit Modal */}
      {isOwnProfile && (
        <UserProfileModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            if (activeUserId) fetchProfile(activeUserId);
          }}
        />
      )}

      {/* Toy Passport DOB Modal */}
      {selectedPassportId && (
        <ToyPassportModal
          listingId={selectedPassportId}
          isOpen={!!selectedPassportId}
          onClose={() => setSelectedPassportId(null)}
        />
      )}

      {/* QR Handover Modal */}
      {selectedTradeId && (
        <QrHandoverModal
          tradeId={selectedTradeId}
          isOpen={!!selectedTradeId}
          onClose={() => setSelectedTradeId(null)}
          onSuccess={() => {
            if (activeUserId) fetchProfile(activeUserId);
          }}
        />
      )}
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-24 text-center">
          <div className="inline-block w-8 h-8 border-2 border-[#00ff87] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
