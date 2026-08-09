"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PriceDisplay from "@/components/toy/PriceDisplay";

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
  status: string;
  seller: {
    displayName: string;
    joyIdAddress: string;
  };
}

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

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
                <span className="category-tag">{item.category}</span>
                <h3>{item.title}</h3>
                <p className="description">{item.description}</p>
                <div className="details-row">
                  <span>Method: <strong>{item.tradeMethod}</strong></span>
                  <span>Region: <strong>{item.shippingRegion || "N/A"}</strong></span>
                </div>
                
                {/* Embedded 3-Price Transparency component */}
                <PriceDisplay 
                  sellerPrice={Number(item.priceFiat)}
                  referencePrice={item.referencePriceFiat ? Number(item.referencePriceFiat) : null}
                  currency={item.currency}
                />

                <div className="footer-row">
                  <span className="seller">Listed by {item.seller?.displayName || "Passkey User"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
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
        .category-tag {
          font-size: 0.75rem;
          color: #00ff87;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
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
