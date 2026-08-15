"use client";

import { useState } from "react";
import Link from "next/link";

export default function MarketingBannersPage() {
  const [activeTab, setActiveTab] = useState<"TWITTER" | "HACKATHON" | "SLIDE">("TWITTER");

  return (
    <div className="marketing-container">
      {/* Controls & Nav */}
      <div className="controls-header">
        <div>
          <h1>ToyTrade — Marketing Banners & Slides</h1>
          <p className="subtitle">
            AI-designed brand assets adhering to the signature Dark & Neon Mint / Cyan Green design system.
          </p>
        </div>
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === "TWITTER" ? "active" : ""}`}
            onClick={() => setActiveTab("TWITTER")}
          >
            Twitter / Social Banner (16:9)
          </button>
          <button
            className={`tab-btn ${activeTab === "HACKATHON" ? "active" : ""}`}
            onClick={() => setActiveTab("HACKATHON")}
          >
            Product Hunt / Hackathon (1200x630)
          </button>
          <button
            className={`tab-btn ${activeTab === "SLIDE" ? "active" : ""}`}
            onClick={() => setActiveTab("SLIDE")}
          >
            Executive Pitch Slide (16:9)
          </button>
        </div>
      </div>

      {/* Banner Display Canvas */}
      <div className="canvas-wrapper">
        {/* 1. Twitter / Social Banner */}
        {activeTab === "TWITTER" && (
          <div className="banner-frame twitter-banner">
            <div className="glow-effect top-right"></div>
            <div className="glow-effect bottom-left"></div>

            <div className="banner-content">
              {/* Top Nav Bar */}
              <div className="banner-top">
                <div className="brand-badge">
                  <span className="brand-logo">ToyTrade</span>
                  <span className="platform-tag">P2P Toy Exchange</span>
                </div>
                <div className="network-pill">
                  <span className="dot"></span>
                  <span>Powered by <strong>Nervos CKB & Fiber</strong></span>
                </div>
              </div>

              {/* Main Banner Body */}
              <div className="banner-grid">
                <div className="hero-text-col">
                  <div className="tagline-pill">⚡ SUB-SECOND SETTLEMENT & ZERO SCAMS</div>
                  <h2 className="headline">
                    Trade Kids' Toys Securely with <span className="gradient-text">CKB Smart Escrow</span>
                  </h2>
                  <p className="hero-desc">
                    Don't buy new—trade used toys! Protect both buyer & seller with 2-of-2 on-chain cell escrow, immutable Spore DOB digital passports, and instant Fiber Network handovers.
                  </p>

                  <div className="features-row">
                    <div className="feature-item">
                      <span className="check">✓</span>
                      <span>JoyID Biometric Passkeys</span>
                    </div>
                    <div className="feature-item">
                      <span className="check">✓</span>
                      <span>Sub-Second Fiber Handover</span>
                    </div>
                    <div className="feature-item">
                      <span className="check">✓</span>
                      <span>Spore DOB Toy Passports</span>
                    </div>
                  </div>

                  <div className="cta-row">
                    <div className="primary-cta">
                      <span>Explore Market</span>
                      <span className="arrow">→</span>
                    </div>
                    <span className="url-link">toy-trading-platform.vercel.app</span>
                  </div>
                </div>

                {/* Right UI Mockup Card */}
                <div className="mockup-col">
                  <div className="mockup-card">
                    <div className="card-top-status">
                      <span className="status-live">LIVE ESCROW ACTIVE</span>
                      <span className="engine-tag">FIBER L2</span>
                    </div>
                    <div className="card-item-info">
                      <h3>LEGO Star Wars Millennium Falcon</h3>
                      <div className="price-tag-row">
                        <span className="fiat-price">£120.00</span>
                        <span className="ckb-rate">≈ 14,117 CKB</span>
                      </div>
                    </div>

                    <div className="qr-demo-box">
                      <div className="qr-screen">
                        <div className="corner c-tl"></div>
                        <div className="corner c-tr"></div>
                        <div className="corner c-bl"></div>
                        <span className="qr-center">FIBER</span>
                      </div>
                      <div className="qr-meta">
                        <span className="qr-label">1-Time Meetup Handover Invoice</span>
                        <span className="qr-code">fbr_invoice_98b3...</span>
                      </div>
                    </div>

                    <div className="security-notice">
                      <span>🛡️ Funds release immediately upon QR scan with cryptographic preimage proof</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. Hackathon / Product Banner */}
        {activeTab === "HACKATHON" && (
          <div className="banner-frame hackathon-banner">
            <div className="glow-effect center-glow"></div>

            <div className="banner-content">
              <div className="banner-top">
                <div className="brand-badge">
                  <span className="brand-logo">ToyTrade</span>
                  <span className="version-pill">CKB HACKATHON 2026</span>
                </div>
                <div className="badges-group">
                  <span className="tech-badge">Cell Model Escrow</span>
                  <span className="tech-badge">Fiber Layer 2</span>
                  <span className="tech-badge">Spore Protocol</span>
                </div>
              </div>

              <div className="center-headline-group">
                <h2 className="hackathon-headline">
                  The Trustless P2P Toy Exchange Built on <span className="gradient-text">Nervos CKB</span>
                </h2>
                <p className="hackathon-sub">
                  Solving the $100B second-hand toy trust dilemma with dual-locked smart contracts and decentralized digital passports.
                </p>
              </div>

              <div className="three-cards-grid">
                <div className="pillar-card">
                  <div className="pillar-num">01</div>
                  <h3>Dual-Lock Escrow</h3>
                  <p>Funds locked trustlessly in CKB cells. 7-day timeout safeguard allows buyer refunds if seller ghosts.</p>
                </div>
                <div className="pillar-card highlight">
                  <div className="pillar-num">02</div>
                  <h3>Instant Fiber Handover</h3>
                  <p>Sub-second QR settlement at in-person meetups with automatic L1 on-chain fallback.</p>
                </div>
                <div className="pillar-card">
                  <div className="pillar-num">03</div>
                  <h3>Spore DOB Passport</h3>
                  <p>Immutable on-chain digital passport tracking previous owners, ratings, and verified condition history.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Executive Slide Format */}
        {activeTab === "SLIDE" && (
          <div className="banner-frame slide-banner">
            <div className="banner-content">
              <div className="banner-top">
                <h2 className="slide-title">Traditional Marketplaces vs. <span className="gradient-text">ToyTrade on CKB</span></h2>
                <span className="slide-tag">Executive Overview</span>
              </div>

              <div className="comparison-table">
                <div className="table-header-row">
                  <div className="col-feature">Feature / Protection</div>
                  <div className="col-trad">Traditional (Chợ Tốt, FB Marketplace)</div>
                  <div className="col-toytrade">ToyTrade (Nervos CKB + Fiber)</div>
                </div>

                <div className="table-row">
                  <div className="col-feature">Payment Solvency</div>
                  <div className="col-trad">❌ Fake bank slips, zero upfront proof</div>
                  <div className="col-toytrade highlight-green">✅ Guaranteed CKB deposit locked in smart contract</div>
                </div>

                <div className="table-row">
                  <div className="col-feature">Chargeback & Fraud</div>
                  <div className="col-trad">❌ High dispute risk, stolen card chargebacks</div>
                  <div className="col-toytrade highlight-green">✅ Final & non-repudiable via Fiber preimage proof</div>
                </div>

                <div className="table-row">
                  <div className="col-feature">Settlement Speed</div>
                  <div className="col-trad">⚠️ Banking delays or manual cash handling</div>
                  <div className="col-toytrade highlight-green">⚡ Sub-second QR handover via Fiber Network</div>
                </div>

                <div className="table-row">
                  <div className="col-feature">Toy History & Provenance</div>
                  <div className="col-trad">❌ Unverified claims, high counterfeit risk</div>
                  <div className="col-toytrade highlight-green">📜 Immutable Spore DOB Toy Passport & safety checks</div>
                </div>
              </div>

              <div className="slide-footer">
                <span>ToyTrade • August 2026</span>
                <span className="footer-badge">Built with Next.js 16 • CKB CCC SDK • Fiber Network (FNN)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .marketing-container {
          min-height: 100vh;
          background: #000000;
          color: #ffffff;
          padding: 40px 24px;
          font-family: Inter, sans-serif;
        }
        .controls-header {
          max-width: 1240px;
          margin: 0 auto 28px auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .controls-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
        }
        h1 {
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0 0 6px 0;
          color: #ffffff;
        }
        .subtitle {
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.9rem;
          margin: 0;
        }
        .tab-buttons {
          display: flex;
          gap: 8px;
          background: #141a20;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          flex-wrap: wrap;
        }
        .tab-btn {
          background: none;
          border: none;
          color: rgba(255, 255, 255, 0.6);
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .tab-btn.active {
          background: #00ff87;
          color: #0a0a0a;
        }
        .canvas-wrapper {
          max-width: 1240px;
          margin: 0 auto;
          display: flex;
          justify-content: center;
        }
        .banner-frame {
          width: 100%;
          background: #0a0e12;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 20px;
          overflow: hidden;
          position: relative;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 255, 135, 0.05);
        }
        .glow-effect {
          position: absolute;
          width: 400px;
          height: 400px;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.15;
          pointer-events: none;
        }
        .glow-effect.top-right {
          top: -100px;
          right: -100px;
          background: #00ff87;
        }
        .glow-effect.bottom-left {
          bottom: -100px;
          left: -100px;
          background: #60efff;
        }
        .glow-effect.center-glow {
          top: 20%;
          left: 30%;
          width: 600px;
          background: #00ff87;
          opacity: 0.08;
        }
        .banner-content {
          position: relative;
          z-index: 2;
          padding: 40px;
        }

        /* Top Nav in Banner */
        .banner-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 36px;
        }
        .brand-badge {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-logo {
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: -0.02em;
          color: #ffffff;
        }
        .platform-tag {
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.5);
          background: rgba(255, 255, 255, 0.05);
          padding: 4px 10px;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .network-pill {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(0, 255, 135, 0.08);
          border: 1px solid rgba(0, 255, 135, 0.25);
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.8);
        }
        .network-pill .dot {
          width: 8px;
          height: 8px;
          background: #00ff87;
          border-radius: 50%;
          box-shadow: 0 0 8px #00ff87;
        }

        /* Twitter Banner Layout */
        .banner-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 36px;
          align-items: center;
        }
        @media (min-width: 900px) {
          .banner-grid {
            grid-template-columns: 1.25fr 1fr;
          }
        }
        .tagline-pill {
          display: inline-block;
          font-size: 0.75rem;
          font-weight: 700;
          color: #60efff;
          letter-spacing: 0.08em;
          margin-bottom: 14px;
        }
        .headline {
          font-size: 2.6rem;
          font-weight: 900;
          line-height: 1.15;
          margin: 0 0 16px 0;
          letter-spacing: -0.03em;
        }
        .gradient-text {
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-desc {
          font-size: 1.05rem;
          line-height: 1.55;
          color: #e2e8f0;
          margin-bottom: 24px;
        }
        .features-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 30px;
        }
        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.95rem;
          color: #ffffff;
          font-weight: 500;
        }
        .feature-item .check {
          color: #00ff87;
          font-weight: 800;
        }
        .cta-row {
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
        }
        .primary-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          color: #0a0a0a;
          font-weight: 800;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 0.95rem;
        }
        .url-link {
          font-family: monospace;
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
        }

        /* Mockup Card */
        .mockup-card {
          background: #141a20;
          border: 1px solid rgba(0, 255, 135, 0.35);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        }
        .card-top-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .status-live {
          font-size: 0.7rem;
          color: #00ff87;
          font-weight: 700;
          letter-spacing: 0.05em;
        }
        .engine-tag {
          font-size: 0.7rem;
          background: rgba(96, 239, 255, 0.15);
          color: #60efff;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 700;
        }
        .card-item-info h3 {
          font-size: 1.1rem;
          margin: 0 0 6px 0;
        }
        .price-tag-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 18px;
        }
        .fiat-price {
          font-size: 1.3rem;
          font-weight: 800;
          color: #ffffff;
        }
        .ckb-rate {
          font-size: 0.85rem;
          color: #00ff87;
          font-weight: 600;
        }
        .qr-demo-box {
          background: #0a0e12;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 14px;
        }
        .qr-screen {
          width: 70px;
          height: 70px;
          background: #ffffff;
          border-radius: 8px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .corner {
          position: absolute;
          width: 10px;
          height: 10px;
          background: #0a0a0a;
        }
        .c-tl { top: 3px; left: 3px; }
        .c-tr { top: 3px; right: 3px; }
        .c-bl { bottom: 3px; left: 3px; }
        .qr-center {
          color: #0a0a0a;
          font-size: 0.7rem;
          font-weight: 900;
        }
        .qr-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .qr-label {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .qr-code {
          font-family: monospace;
          font-size: 0.8rem;
          color: #60efff;
          font-weight: 600;
        }
        .security-notice {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.4;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 12px;
        }

        /* Hackathon Banner */
        .version-pill {
          font-size: 0.75rem;
          background: rgba(0, 255, 135, 0.15);
          color: #00ff87;
          border: 1px solid rgba(0, 255, 135, 0.3);
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 700;
        }
        .badges-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .tech-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #e2e8f0;
          font-size: 0.75rem;
          padding: 4px 10px;
          border-radius: 6px;
        }
        .center-headline-group {
          text-align: center;
          max-width: 800px;
          margin: 0 auto 36px auto;
        }
        .hackathon-headline {
          font-size: 2.3rem;
          font-weight: 900;
          line-height: 1.2;
          margin: 0 0 12px 0;
        }
        .hackathon-sub {
          font-size: 1rem;
          color: #94a3b8;
          line-height: 1.5;
        }
        .three-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .pillar-card {
          background: #141a20;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          padding: 24px;
        }
        .pillar-card.highlight {
          border-color: #00ff87;
          box-shadow: 0 0 20px rgba(0, 255, 135, 0.1);
        }
        .pillar-num {
          font-size: 0.8rem;
          font-weight: 800;
          color: #60efff;
          margin-bottom: 8px;
        }
        .pillar-card h3 {
          font-size: 1.15rem;
          margin: 0 0 8px 0;
          color: #ffffff;
        }
        .pillar-card p {
          font-size: 0.85rem;
          color: #e2e8f0;
          line-height: 1.45;
          margin: 0;
        }

        /* Slide Format */
        .slide-title {
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0;
        }
        .slide-tag {
          font-size: 0.8rem;
          background: rgba(255, 255, 255, 0.08);
          padding: 4px 10px;
          border-radius: 6px;
          color: #94a3b8;
        }
        .comparison-table {
          background: #141a20;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .table-header-row {
          display: grid;
          grid-template-columns: 1.2fr 1.5fr 1.5fr;
          background: rgba(255, 255, 255, 0.04);
          padding: 14px 20px;
          font-weight: 700;
          font-size: 0.85rem;
          color: #ffffff;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .table-row {
          display: grid;
          grid-template-columns: 1.2fr 1.5fr 1.5fr;
          padding: 14px 20px;
          font-size: 0.85rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
          align-items: center;
        }
        .col-feature {
          font-weight: 600;
          color: #ffffff;
        }
        .col-trad {
          color: #94a3b8;
        }
        .col-toytrade {
          color: #e2e8f0;
        }
        .col-toytrade.highlight-green {
          color: #00ff87;
          font-weight: 600;
        }
        .slide-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.8rem;
          color: rgba(255, 255, 255, 0.4);
        }
        .footer-badge {
          background: rgba(255, 255, 255, 0.04);
          padding: 4px 10px;
          border-radius: 6px;
        }
      `}</style>
    </div>
  );
}
