"use client";

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
          gap: 12px;
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
          gap: 8px;
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
