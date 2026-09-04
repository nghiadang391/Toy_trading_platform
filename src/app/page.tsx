"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function Home() {
  const { t } = useLanguage();

  return (
    <div className="landing-container">
      <header className="hero-section">
        <h1 className="hero-title">
          {t("heroTitle").split("CKB Escrow")[0]}
          <span>CKB Escrow</span>
        </h1>
        <p className="hero-subtitle">
          {t("heroSubtitle")}
        </p>
        <div className="hero-actions">
          <Link href="/listings" className="primary-action-btn">
            {t("browseMarket")}
          </Link>
          <Link href="/listings/create" className="secondary-action-btn">
            {t("listAToy")}
          </Link>
        </div>
      </header>

      <section className="features-grid">
        <div className="feature-card">
          <div className="feature-icon">🛡️</div>
          <h3>{t("escrowTitle")}</h3>
          <p>{t("escrowDesc")}</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📖</div>
          <h3>{t("passportTitle")}</h3>
          <p>{t("passportDesc")}</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔍</div>
          <h3>{t("lensTitle")}</h3>
          <p>{t("lensDesc")}</p>
        </div>
      </section>

      {/* Why CKB Education & Storage Economics Section */}
      <section className="why-ckb-section">
        <div className="section-header">
          <span className="section-badge">⚡ Nervos CKB Architecture</span>
          <h2 className="section-title">{t("whyCkbTitle")}</h2>
          <p className="section-subtitle">{t("whyCkbSubtitle")}</p>
        </div>

        <div className="ckb-cards-grid">
          <div className="ckb-card">
            <div className="ckb-card-badge">💾 1 CKB = 1 Byte</div>
            <h3>{t("storageTitle")}</h3>
            <p>{t("storageDesc")}</p>
            <div className="ckb-card-footer">
              <span className="spec-tag">Spore DOB (Cell Model)</span>
            </div>
          </div>

          <div className="ckb-card highlight">
            <div className="ckb-card-badge">🔄 ~244 CKB Capacity</div>
            <h3>{t("mintOnceTitle")}</h3>
            <p>{t("mintOnceDesc")}</p>
            <div className="ckb-card-footer">
              <span className="spec-tag">1st Sale: ~₫30,000 | Resale: ₫0</span>
            </div>
          </div>

          <div className="ckb-card">
            <div className="ckb-card-badge">♻️ Zero Burn</div>
            <h3>{t("recoverableTitle")}</h3>
            <p>{t("recoverableDesc")}</p>
            <div className="ckb-card-footer">
              <span className="spec-tag">100% Refundable Storage</span>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        .landing-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: clamp(40px, 8vw, 80px) 20px;
          font-family: Inter, system-ui, sans-serif;
          display: flex;
          flex-direction: column;
          gap: clamp(40px, 6vw, 80px);
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
          font-size: clamp(2.2rem, 5.5vw, 3.5rem);
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
        }
        .hero-title span {
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-left: 8px;
        }
        .hero-subtitle {
          font-size: clamp(1rem, 2.5vw, 1.2rem);
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.7);
        }
        .hero-actions {
          display: flex;
          gap: 16px;
          margin-top: 16px;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
        }
        .primary-action-btn {
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          color: #0a0a0a;
          padding: 14px 28px;
          font-weight: 600;
          border-radius: 8px;
          text-decoration: none;
          transition: transform 0.2s, opacity 0.2s;
          text-align: center;
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
          text-align: center;
        }
        .secondary-action-btn:hover {
          transform: translateY(-2px);
          background: rgba(255, 255, 255, 0.12);
        }
        @media (max-width: 500px) {
          .hero-actions {
            flex-direction: column;
          }
          .primary-action-btn,
          .secondary-action-btn {
            width: 100%;
          }
        }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }
        @media (max-width: 900px) {
          .features-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
        .feature-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: clamp(20px, 4vw, 32px);
          display: flex;
          flex-direction: column;
          gap: 16px;
          transition: transform 0.2s, border-color 0.2s;
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

        .why-ckb-section {
          display: flex;
          flex-direction: column;
          gap: 32px;
          margin-top: 20px;
          background: linear-gradient(180deg, rgba(0, 255, 135, 0.03) 0%, rgba(96, 239, 255, 0.01) 100%);
          border: 1px solid rgba(0, 255, 135, 0.15);
          border-radius: 24px;
          padding: clamp(24px, 5vw, 48px);
        }
        .section-header {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .section-badge {
          background: rgba(0, 255, 135, 0.1);
          border: 1px solid rgba(0, 255, 135, 0.3);
          color: #00ff87;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          padding: 6px 14px;
          border-radius: 999px;
        }
        .section-title {
          font-size: clamp(1.8rem, 4vw, 2.4rem);
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .section-subtitle {
          max-width: 680px;
          font-size: clamp(0.95rem, 2vw, 1.05rem);
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.65);
        }
        .ckb-cards-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        @media (max-width: 900px) {
          .ckb-cards-grid {
            grid-template-columns: 1fr;
          }
        }
        .ckb-card {
          background: rgba(18, 18, 18, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
          transition: transform 0.2s, border-color 0.2s;
        }
        .ckb-card:hover {
          transform: translateY(-4px);
          border-color: rgba(96, 239, 255, 0.4);
        }
        .ckb-card.highlight {
          border-color: rgba(0, 255, 135, 0.4);
          background: linear-gradient(180deg, rgba(0, 255, 135, 0.06) 0%, rgba(18, 18, 18, 0.9) 100%);
        }
        .ckb-card-badge {
          align-self: flex-start;
          font-size: 0.75rem;
          font-weight: 700;
          color: #60efff;
          background: rgba(96, 239, 255, 0.1);
          border: 1px solid rgba(96, 239, 255, 0.25);
          padding: 4px 10px;
          border-radius: 6px;
        }
        .ckb-card h3 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #ffffff;
        }
        .ckb-card p {
          font-size: 0.92rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.7);
          flex-grow: 1;
        }
        .ckb-card-footer {
          margin-top: 8px;
          padding-top: 12px;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
        }
        .spec-tag {
          font-size: 0.75rem;
          font-weight: 600;
          color: #00ff87;
        }
      `}</style>
    </div>
  );
}
