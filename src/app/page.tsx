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
    </div>
  );
}
