"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PriceDisplay from "@/components/toy/PriceDisplay";
import ToyPassportModal from "@/components/passport/ToyPassportModal";
import QrHandoverModal from "@/components/trade/QrHandoverModal";
import ChatModal from "@/components/chat/ChatModal";

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
    displayName: string;
    joyIdAddress: string;
  };
  trades?: Array<{ id: string }>;
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [selectedPassportId, setSelectedPassportId] = useState<string | null>(null);
  const [selectedTradeId, setSelectedTradeId] = useState<string | null>(null);

  // Chat Modal State
  const [selectedChatListing, setSelectedChatListing] = useState<Listing | null>(null);

  // Dummy Buyer ID for MVP simulations
  const dummyBuyerId = "cmslwc9bl0001oerq542iln7o"; // Seed user ID

  useEffect(() => {
    async function fetchListings() {
      try {
        const res = await fetch("/api/listings");
        const data = await res.json();
        setListings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load listings:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
  }, []);

  return (
    <div className="container">
      <div className="header-row">
        <h1>Browse Used Toys</h1>
        <Link href="/listings/create" className="sell-btn">
          Sell a Toy
        </Link>
      </div>

      {loading ? (
        <div className="loading">Loading listings...</div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <p>No toys listed for trade yet. Be the first to list one!</p>
          <Link href="/listings/create" className="sell-btn inline">
            List a Toy Now
          </Link>
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map((item) => (
            <div key={item.id} className="card">
              {item.imageUrls && item.imageUrls.length > 0 ? (
                <img src={item.imageUrls[0]} alt={item.title} className="card-image" />
              ) : (
                <div className="card-image-placeholder">🧸</div>
              )}
              <div className="card-content">
                <div className="card-header-tags">
                  <span className="category-tag">{item.category}</span>
                  {item.isRecalled ? (
                    <span className="safety-tag hazard" title={item.recallReason || "Safety Warning"}>
                      ⚠️ Recalled
                    </span>
                  ) : (
                    <span className="safety-tag safe">🛡️ Safety Checked</span>
                  )}
                </div>

                <h3>{item.title}</h3>
                <p className="description">{item.description}</p>
                <div className="details-row">
                  <span>Method: <strong>{item.tradeMethod}</strong></span>
                  <span>Region: <strong>{item.shippingRegion || "N/A"}</strong></span>
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

                {/* Interactive Action Buttons for Toy Passport, QR Handover & Chat */}
                <div className="card-actions">
                  <button
                    className="action-btn passport-btn"
                    onClick={() => setSelectedPassportId(item.id)}
                  >
                    📜 Passport
                  </button>

                  <button
                    className="action-btn qr-btn"
                    onClick={() => setSelectedTradeId(item.trades?.[0]?.id || item.id)}
                  >
                    📱 Handover
                  </button>

                  <button
                    className="action-btn chat-btn"
                    onClick={() => setSelectedChatListing(item)}
                    disabled={item.sellerId === dummyBuyerId} // Can't chat with self
                  >
                    💬 Chat
                  </button>
                </div>

                <div className="footer-row">
                  <span className="seller">Listed by {item.seller?.displayName || "Passkey User"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
          buyerId={dummyBuyerId}
          sellerId={selectedChatListing.sellerId}
          sellerName={selectedChatListing.seller.displayName}
          toyTitle={selectedChatListing.title}
          isOpen={!!selectedChatListing}
          onClose={() => setSelectedChatListing(null)}
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
        }
        .description {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.4;
          height: 40px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .details-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
          margin-top: 4px;
        }
        .location-row {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          color: #60efff;
          margin-top: 2px;
        }
        .card-actions {
          display: flex;
          gap: 6px;
          margin-top: 8px;
        }
        .action-btn {
          flex: 1;
          padding: 8px 6px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .passport-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
        }
        .passport-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .qr-btn {
          background: rgba(0, 255, 135, 0.1);
          border: 1px solid rgba(0, 255, 135, 0.3);
          color: #00ff87;
        }
        .qr-btn:hover {
          background: rgba(0, 255, 135, 0.2);
        }
        .chat-btn {
          background: rgba(96, 239, 255, 0.1);
          border: 1px solid rgba(96, 239, 255, 0.3);
          color: #60efff;
        }
        .chat-btn:hover:not(:disabled) {
          background: rgba(96, 239, 255, 0.2);
        }
        .chat-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 12px;
        }
        .seller {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
        }
      `}</style>
    </div>
  );
}
