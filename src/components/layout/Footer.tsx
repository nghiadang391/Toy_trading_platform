"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="brand-line">
          <span className="brand-name">ToyTrade</span>
          <span className="divider">•</span>
          <span className="tagline">Secure P2P Kids' Toy Exchange</span>
          <Link href="/marketing" className="brand-assets-btn">
            <span>{t("brandAssets")}</span>
            <span className="arrow-icon">↗</span>
          </Link>
        </div>

        <div className="powered-badge">
          <span className="powered-text">Powered by</span>
          <span className="badge-tech ckb">Nervos CKB</span>
          <span className="amp">&</span>
          <span className="badge-tech fiber">Fiber Network</span>
        </div>
      </div>
    </footer>
  );
}
