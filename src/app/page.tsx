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
      `}</style>
    </div>
  );
}
