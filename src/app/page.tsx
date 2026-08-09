"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="landing-container">
      <header className="hero-section">
        <h1 className="hero-title">
          Trade Kids' Toys Securely with <span>CKB Escrow</span>
        </h1>
        <p className="hero-subtitle">
          Don't buy new—trade used toys! Each toy gets an on-chain **Toy Passport (Spore DOB)** tracking ownership, ratings, and provenance. Settle payments in CKB with hidden wallet complexity.
        </p>
        <div className="hero-actions">
          <Link href="/listings" className="primary-action-btn">
            Browse Market
          </Link>
          <Link href="/listings/create" className="secondary-action-btn">
            List a Toy
          </Link>
        </div>
      </header>

      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3>CKB Trust Escrow</h3>
          <p>Locked smart contracts ensure CKB payments are only released when both parties confirm meetup or shipping delivery.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📖</div>
          <h3>Toy Passport DOB</h3>
          <p>Every toy has an on-chain ownership timeline (Spore DOB NFT) containing verification data that transfers with the trade.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>Visual Reference Price</h3>
          <p>Google Lens visual shopping lookup checks the average market price of the toy so you get a fair deal.</p>
        </div>
      </section>

      <style jsx>{`
        .landing-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px;
          font-family: Inter, system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          gap: 80px;
        }
        .hero-section {
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
        }
        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
        }
        .hero-title span {
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          font-size: 1.2rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.7);
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          margin-top: 16px;
        }
        .primary-action-btn {
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          color: #0a0a0a;
          padding: 14px 28px;
          font-weight: 600;
          border-radius: 8px;
          text-decoration: none;
          transition: transform 0.2s, opacity 0.2s;
        }
        .primary-action-btn:hover {
          transform: translateY(-2px);
          opacity: 0.95;
        }
        .secondary-action-btn {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 14px 28px;
          font-weight: 600;
          border-radius: 8px;
          text-decoration: none;
          transition: transform 0.2s, background 0.2s;
        }
        .secondary-action-btn:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.12);
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        .feature-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: transform 0.2s;
        }
        .feature-card:hover {
          transform: translateY(-4px);
          border-color: rgba(0, 255, 135, 0.3);
        }
        .feature-icon {
          font-size: 2rem;
        }
        .feature-card h3 {
          font-size: 1.35rem;
          font-weight: 700;
        }
        .feature-card p {
          font-size: 0.95rem;
          line-height: 1.5;
          color: rgba(255, 255, 255, 0.6);
        }
      `}</style>
    </div>
  );
}
