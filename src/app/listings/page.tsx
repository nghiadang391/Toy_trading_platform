"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import PriceDisplay from "@/components/toy/PriceDisplay";
import ToyPassportModal from "@/components/passport/ToyPassportModal";
import QrHandoverModal from "@/components/trade/QrHandoverModal";
import ChatModal from "@/components/chat/ChatModal";
import BuyToyModal from "@/components/trade/BuyToyModal";
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
  referencePriceFiat: number | null;
  imageUrls: string[];
  tradeMethod: string;
  shippingRegion: string;
  location: string | null;
  isRecalled: boolean;
  recallReason: string | null;
  status: string;
  sellerId: string;
  seller: {
    id?: string;
    displayName: string;
    joyIdAddress: string;
    rating?: number | null;
    reviewCount?: number;
    completedTrades?: number;
  };
  sporeDobId?: string | null;
  trades?: Array<{
    id: string;
    status: string;
    buyerId: string;
    sellerId: string;
  }>;
}

// Module-level client cache for instant (<50ms) page loads on repeat navigation
let clientListingsCache: { data: Listing[]; timestamp: number } | null = null;

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>(() => {
    return clientListingsCache?.data || [];
  });
  const [loading, setLoading] = useState(() => {
    return !clientListingsCache?.data?.length;
  });
  const { t } = useLanguage();
  const { user, connectWallet } = useUser();
  const isInitialMount = useRef(true);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedRegion, setSelectedRegion] = useState("ALL");

  // Modal State
  const [selectedPassportId, setSelectedPassportId] = useState<string | null>(null);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);
  const [selectedBuyListing, setSelectedBuyListing] = useState<Listing | null>(null);

  // Chat Modal State
  const [selectedChatListing, setSelectedChatListing] = useState<Listing | null>(null);
  const [chatBuyerId, setChatBuyerId] = useState<string>("");

  const activeBuyerId = chatBuyerId || user?.id || user?.joyIdAddress || "";

  async function fetchListings(isSilent = false) {
    try {
      if (!isSilent) {
        setLoading(true);
      }
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append("search", searchQuery.trim());
      if (selectedCategory !== "ALL") params.append("category", selectedCategory);
      if (selectedRegion !== "ALL") params.append("region", selectedRegion);

      const url = `/api/listings${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      const filtered = Array.isArray(data) ? data.filter((i: Listing) => i.status !== "TRADED") : [];
      setListings(filtered);
      clientListingsCache = { data: filtered, timestamp: Date.now() };
    } catch (err) {
      console.error("Failed to load listings:", err);
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }

  // Fetch immediately on initial mount (0ms delay); debounce only on search/filter changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      fetchListings();
      return;
    }

    const handler = setTimeout(() => {
      fetchListings();
    }, 250);

    return () => clearTimeout(handler);
  }, [searchQuery, selectedCategory, selectedRegion]);

  // Real-time background sync: periodic polling (10s), window focus/visibility, and live custom events
  useEffect(() => {
    const interval = setInterval(() => {
      fetchListings(true);
    }, 10000);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === "visible") {
        fetchListings(true);
      }
    };

    const handleLiveUpdates = () => {
      clientListingsCache = null;
      fetchListings(true);
    };

    window.addEventListener("focus", handleFocusOrVisible);
    document.addEventListener("visibilitychange", handleFocusOrVisible);
    window.addEventListener("toytrade:tradeUpdated", handleLiveUpdates);
    window.addEventListener("toytrade:listingUpdated", handleLiveUpdates);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocusOrVisible);
      document.removeEventListener("visibilitychange", handleFocusOrVisible);
      window.removeEventListener("toytrade:tradeUpdated", handleLiveUpdates);
      window.removeEventListener("toytrade:listingUpdated", handleLiveUpdates);
    };
  }, [searchQuery, selectedCategory, selectedRegion]);

  const handleOpenChat = async (item: Listing) => {
    let activeUser = user;
    if (!activeUser) {
      activeUser = await connectWallet();
      if (!activeUser) return;
    }
    setChatBuyerId(activeUser.id || activeUser.joyIdAddress);
    setSelectedChatListing(item);
  };

  return (
    <div className="container">
      <div className="header-row">
        <h1>{t("browseUsedToys")}</h1>
        <Link href="/listings/create" className="sell-btn">
          {t("sellAToy")}
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="search-filter-bar">
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="search-input"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchQuery("")}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">{t("allCategories")}</option>
            <option value="BUILDING_SETS">{t("cat_BUILDING_SETS")}</option>
            <option value="ACTION_FIGURES">{t("cat_ACTION_FIGURES")}</option>
            <option value="DOLLS">{t("cat_DOLLS")}</option>
            <option value="PUZZLES">{t("cat_PUZZLES")}</option>
            <option value="BOARD_GAMES">{t("cat_BOARD_GAMES")}</option>
            <option value="EDUCATIONAL">{t("cat_EDUCATIONAL")}</option>
            <option value="OUTDOOR">{t("cat_OUTDOOR")}</option>
            <option value="VEHICLES">{t("cat_VEHICLES")}</option>
            <option value="OTHER">{t("cat_OTHER")}</option>
          </select>

          <select
            className="filter-select"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            <option value="ALL">{t("allRegions")}</option>
            <option value="UK">United Kingdom</option>
            <option value="VIETNAM">Vietnam</option>
          </select>

          {(searchQuery || selectedCategory !== "ALL" || selectedRegion !== "ALL") && (
            <button
              className="reset-filters-btn"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
                setSelectedRegion("ALL");
              }}
            >
              {t("clearFilters")}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading">{t("loadingListings")}</div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <p>{searchQuery || selectedCategory !== "ALL" || selectedRegion !== "ALL" ? t("noMatchingToys") : t("noToysYet")}</p>
          {searchQuery || selectedCategory !== "ALL" || selectedRegion !== "ALL" ? (
            <button
              className="sell-btn inline"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("ALL");
                setSelectedRegion("ALL");
              }}
            >
              {t("clearFilters")}
            </button>
          ) : (
            <Link href="/listings/create" className="sell-btn inline">
              {t("listAToyNow")}
            </Link>
          )}
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map((item) => {
            const isOwnListing = Boolean(user && item.sellerId === user.id);
            const isUserInTrade = Boolean(
              user && item.trades?.some((tr) => (tr.buyerId === user.id || tr.sellerId === user.id) && tr.status !== "CANCELLED" && tr.status !== "REJECTED_REFUNDED")
            );
            const activeTrade = item.trades?.find(
              (tr) => (tr.buyerId === user?.id || tr.sellerId === user?.id) && tr.status !== "CANCELLED" && tr.status !== "REJECTED_REFUNDED"
            );

            return (
              <div key={item.id} className="card">
                {item.imageUrls && item.imageUrls.length > 0 ? (
                  item.imageUrls[0].startsWith("data:video/") ||
                  item.imageUrls[0].endsWith(".mp4") ||
                  item.imageUrls[0].endsWith(".webm") ? (
                    <video
                      src={item.imageUrls[0]}
                      className="card-image"
                      controls
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={item.imageUrls[0]}
                      alt={item.title}
                      className="card-image"
                    />
                  )
                ) : (
                  <div className="card-image-placeholder">🧸</div>
                )}
                <div className="card-content">
                  <div className="card-header-tags">
                    <span className="category-tag">{item.category}</span>
                    {item.isRecalled ? (
                      <span className="safety-tag hazard" title={item.recallReason || "Safety Warning"}>
                        ⚠️ {t("recalled")}
                      </span>
                    ) : (
                      <span className="safety-tag safe">🛡️ {t("safetyChecked")}</span>
                    )}
                  </div>

                  <h3>{item.title}</h3>
                  <p className="description">{item.description}</p>
                  <div className="details-row">
                    <span>{t("method")}: <strong>{t(`method_${item.tradeMethod}`)}</strong></span>
                    <span>{t("region")}: <strong>{item.shippingRegion || "N/A"}</strong></span>
                  </div>
                  {item.location && (
                    <div className="location-row">
                      📍 <span>{item.location}</span>
                    </div>
                  )}
                  
                  {/* Embedded 3-Price Transparency component */}
                  <PriceDisplay 
                    sellerPrice={Number(item.priceFiat)}
                    referencePrice={item.referencePriceFiat ? Number(item.referencePriceFiat) : null}
                    currency={item.currency}
                  />

                  {/* Transparent CKB Passport Storage Fee Badge */}
                  <div 
                    className={`passport-fee-badge ${item.sporeDobId ? "resale" : "new"}`}
                    title={
                      item.sporeDobId 
                        ? t("passportFeeDetailResale") 
                        : (item.currency === "VND" ? t("passportFeeDetailNewVnd") : t("passportFeeDetailNewGbp"))
                    }
                  >
                    <span className="badge-text">
                      {item.sporeDobId ? t("passportFeeBadgeResale") : t("passportFeeBadgeNew")}
                    </span>
                    <span className="badge-capacity">244 CKB</span>
                  </div>

                  {/* Prominent Buy & Actions Bar */}
                  <div className="card-actions">
                    <button
                      className="action-btn buy-btn"
                      disabled={isOwnListing || item.status !== "ACTIVE"}
                      onClick={() => setSelectedBuyListing(item)}
                      title={isOwnListing ? t("yourToy") : t("buyBtn")}
                    >
                      💳 {isOwnListing ? t("yourToy") : item.status === "ACTIVE" ? t("buyBtn") : item.status}
                    </button>

                    <div className="secondary-actions">
                      <button
                        className="action-btn chat-btn"
                        onClick={() => handleOpenChat(item)}
                        disabled={isOwnListing}
                        title={isOwnListing ? t("yourToy") : t("chatBtn")}
                      >
                        💬 {t("chatBtn")}
                      </button>

                      <button
                        className="action-btn passport-btn"
                        onClick={() => setSelectedPassportId(item.id)}
                      >
                        📜 {t("passportBtn")}
                      </button>

                      {isUserInTrade && (
                        <button
                          className="action-btn qr-btn"
                          onClick={() => setSelectedTradeId(activeTrade?.id || "")}
                          title={t("handoverBtn")}
                        >
                          📱 {t("handoverBtn")}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="footer-row flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#00ff87] to-[#60efff] text-black font-bold flex items-center justify-center text-[10px]">
                        {(item.seller?.displayName || "U").charAt(0).toUpperCase()}
                      </div>
                      <span className="seller text-white/70">
                        {t("listedBy")}{" "}
                        <Link
                          href={`/profile?userId=${item.seller?.id || item.seller?.joyIdAddress}`}
                          className="text-white font-medium hover:text-[#00ff87] transition-colors underline-offset-2 hover:underline"
                        >
                          {isOwnListing ? "You" : item.seller?.displayName || "Passkey User"}
                        </Link>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.seller?.rating !== undefined && item.seller?.rating !== null ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-400/10 text-yellow-400 font-semibold text-[11px] border border-yellow-400/20">
                          <span>★</span>
                          <span>{item.seller.rating}</span>
                          <span className="text-white/40 font-normal">({item.seller.reviewCount})</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-white/5 text-white/40 text-[10px] border border-white/10">
                          {t("newTrader")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Buy / Escrow Modal */}
      <BuyToyModal
        listing={selectedBuyListing}
        isOpen={!!selectedBuyListing}
        onClose={() => setSelectedBuyListing(null)}
        onSuccess={() => {
          setSelectedBuyListing(null);
          clientListingsCache = null;
          fetchListings();
        }}
      />

      {/* Toy Passport Spore DOB Modal */}
      <ToyPassportModal
        listingId={selectedPassportId || ""}
        isOpen={!!selectedPassportId}
        onClose={() => setSelectedPassportId(null)}
      />

      {/* QR Meetup Handover Modal */}
      <QrHandoverModal
        tradeId={selectedTradeId || ""}
        isOpen={!!selectedTradeId}
        onClose={() => setSelectedTradeId(null)}
      />

      {/* P2P Chat Modal */}
      {selectedChatListing && (
        <ChatModal
          listingId={selectedChatListing.id}
          buyerId={activeBuyerId}
          sellerId={selectedChatListing.sellerId}
          sellerName={selectedChatListing.seller.displayName}
          toyTitle={selectedChatListing.title}
          isOpen={!!selectedChatListing}
          onClose={() => {
            setSelectedChatListing(null);
            setChatBuyerId("");
          }}
        />
      )}

      <style jsx>{`
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 24px;
          font-family: Inter, sans-serif;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        h1 {
          font-size: 2.25rem;
          font-weight: 800;
          color: #ffffff;
        }
        .sell-btn {
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          color: #0a0a0a;
          padding: 10px 20px;
          font-weight: 600;
          border-radius: 8px;
          text-decoration: none;
          transition: transform 0.2s;
        }
        .sell-btn:hover {
          transform: translateY(-1px);
        }
        .sell-btn.inline {
          margin-top: 16px;
          display: inline-block;
        }
        .loading {
          text-align: center;
          padding: 80px 0;
          color: rgba(255, 255, 255, 0.5);
          font-size: 1.1rem;
        }
        .empty-state {
          text-align: center;
          padding: 80px 24px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 16px;
        }
        .empty-state p {
          color: rgba(255, 255, 255, 0.6);
          margin-bottom: 16px;
        }
        .listings-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }
        .card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          overflow: hidden;
          transition: border-color 0.2s;
          display: flex;
          flex-direction: column;
        }
        .card:hover {
          border-color: rgba(0, 255, 135, 0.3);
        }
        .card-image {
          height: 200px;
          width: 100%;
          object-fit: cover;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .card-image-placeholder {
          height: 200px;
          background: rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .card-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex-grow: 1;
        }
        .card-header-tags {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .category-tag {
          font-size: 0.75rem;
          color: #00ff87;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .safety-tag {
          font-size: 0.75rem;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 600;
        }
        .safety-tag.safe {
          background: rgba(0, 255, 135, 0.1);
          color: #00ff87;
        }
        .safety-tag.hazard {
          background: rgba(255, 71, 87, 0.1);
          color: #ff4757;
        }
        .card-content h3 {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
          margin: 4px 0;
        }
        .description {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: 8px;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
        .details-row strong {
          color: rgba(255, 255, 255, 0.85);
        }
        .location-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: #ff4757;
        }
        .passport-fee-badge {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 500;
          cursor: help;
          transition: background 0.2s, border-color 0.2s;
        }
        .passport-fee-badge.new {
          background: rgba(0, 255, 135, 0.06);
          border: 1px solid rgba(0, 255, 135, 0.2);
          color: #00ff87;
        }
        .passport-fee-badge.resale {
          background: rgba(96, 239, 255, 0.08);
          border: 1px solid rgba(96, 239, 255, 0.25);
          color: #60efff;
        }
        .badge-capacity {
          background: rgba(255, 255, 255, 0.08);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.03em;
        }
        .search-filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 28px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          padding: 14px 18px;
          border-radius: 12px;
        }
        .search-input-wrapper {
          position: relative;
          flex: 1;
          min-width: 260px;
          display: flex;
          align-items: center;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          font-size: 0.95rem;
          opacity: 0.6;
          pointer-events: none;
        }
        .search-input {
          width: 100%;
          padding: 10px 36px 10px 38px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          color: #ffffff;
          font-size: 0.9rem;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .search-input:focus {
          border-color: #00ff87;
          box-shadow: 0 0 0 2px rgba(0, 255, 135, 0.2);
        }
        .search-input::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
        .clear-search-btn {
          position: absolute;
          right: 10px;
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          cursor: pointer;
          padding: 4px;
        }
        .clear-search-btn:hover {
          color: #ffffff;
        }
        .filter-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          align-items: center;
        }
        .filter-select {
          padding: 10px 14px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 8px;
          color: #ffffff;
          font-size: 0.85rem;
          outline: none;
          cursor: pointer;
          transition: border-color 0.2s;
        }
        .filter-select:focus {
          border-color: #00ff87;
        }
        .filter-select option {
          background: #111827;
          color: #ffffff;
        }
        .reset-filters-btn {
          padding: 9px 14px;
          background: rgba(255, 71, 87, 0.1);
          border: 1px solid rgba(255, 71, 87, 0.25);
          color: #ff6b81;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .reset-filters-btn:hover {
          background: rgba(255, 71, 87, 0.2);
        }
        .card-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 10px;
        }
        .secondary-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(75px, 1fr));
          gap: 6px;
        }
        .action-btn {
          padding: 8px 10px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .buy-btn {
          width: 100%;
          padding: 10px 16px;
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          color: #050b14;
          font-weight: 700;
          font-size: 0.9rem;
          box-shadow: 0 2px 10px rgba(0, 255, 135, 0.2);
        }
        .buy-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(0, 255, 135, 0.35);
        }
        .buy-btn:disabled {
          background: rgba(255, 255, 255, 0.08);
          color: rgba(255, 255, 255, 0.4);
          cursor: not-allowed;
          box-shadow: none;
        }
        .passport-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }
        .passport-btn:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .qr-btn {
          background: rgba(0, 255, 135, 0.1);
          border: 1px solid rgba(0, 255, 135, 0.2);
          color: #00ff87;
        }
        .qr-btn:hover {
          background: rgba(0, 255, 135, 0.15);
        }
        .chat-btn {
          background: rgba(96, 239, 255, 0.1);
          border: 1px solid rgba(96, 239, 255, 0.2);
          color: #60efff;
        }
        .chat-btn:hover:not(:disabled) {
          background: rgba(96, 239, 255, 0.15);
        }
        .chat-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
          background: rgba(255, 255, 255, 0.05);
          color: rgba(255, 255, 255, 0.4);
        }
        .footer-row {
          margin-top: auto;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.45);
        }
      `}</style>
    </div>
  );
}
