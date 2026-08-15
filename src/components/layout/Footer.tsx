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

      <style jsx>{`
        .footer-container {
          margin-top: auto;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          background: rgba(10, 10, 10, 0.95);
          padding: 24px 20px;
          color: rgba(255, 255, 255, 0.6);
          font-size: 0.85rem;
        }
        .footer-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 14px;
          text-align: center;
        }
        @media (min-width: 640px) {
          .footer-content {
            flex-direction: row;
            justify-content: space-between;
          }
        }
        .brand-line {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
        }
        .brand-name {
          font-weight: 700;
          color: #ffffff;
        }
        .divider {
          color: rgba(255, 255, 255, 0.3);
        }
        .tagline {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.8rem;
        }
        :global(.brand-assets-btn) {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(96, 239, 255, 0.08);
          border: 1px solid rgba(96, 239, 255, 0.35);
          color: #60efff !important;
          padding: 3px 10px;
          border-radius: 6px;
          font-size: 0.76rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        :global(.brand-assets-btn:hover) {
          background: rgba(0, 255, 135, 0.18);
          border-color: #00ff87;
          color: #00ff87 !important;
          transform: translateY(-1px);
          box-shadow: 0 0 12px rgba(0, 255, 135, 0.25);
        }
        .arrow-icon {
          font-size: 0.75rem;
          opacity: 0.8;
          transition: transform 0.2s;
        }
        :global(.brand-assets-btn:hover) .arrow-icon {
          transform: translate(1px, -1px);
          opacity: 1;
        }
        .powered-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.6);
        }
        .badge-tech {
          font-weight: 600;
        }
        .badge-tech.ckb {
          color: #60efff;
        }
        .badge-tech.fiber {
          color: #00ff87;
        }
        .amp {
          color: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </footer>
  );
}
