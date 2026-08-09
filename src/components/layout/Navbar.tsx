"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  async function connectWallet() {
    setConnecting(true);
    try {
      // Import JoyID dynamically for SSR safety
      const { init, connect } = await import("@joyid/ckb");
      init({
        name: "ToyTrade",
        logo: "https://toytrade.vercel.app/logo.png",
        network: "testnet",
      });

      const res = await connect();
      if (res && res.address) {
        setWalletAddress(res.address);
        // Sync user backend registry profile
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            joyIdAddress: res.address,
            displayName: "Passkey Explorer " + res.address.substring(res.address.length - 4),
            region: "UK",
          }),
        });
      }
    } catch (err) {
      console.error("JoyID Connection failed:", err);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          Toy<span>Trade</span>
        </Link>
        <div className="nav-links">
          <Link href="/listings" className="nav-link">Browse Toys</Link>
          <Link href="/listings/create" className="nav-link">Sell a Toy</Link>
        </div>
        <div className="nav-auth">
          {walletAddress ? (
            <span className="wallet-badge">
              🔑 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
            </span>
          ) : (
            <button className="connect-btn" onClick={connectWallet} disabled={connecting}>
              {connecting ? "Connecting..." : "Fingerprint Connect"}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .navbar {
          background: rgba(10, 10, 10, 0.8);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          position: sticky;
          top: 0;
          z-index: 100;
          font-family: Inter, sans-serif;
        }
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .nav-logo {
          font-size: 1.5rem;
          font-weight: 800;
          color: #ffffff;
          text-decoration: none;
          letter-spacing: -0.02em;
        }
        .nav-logo span {
          color: #00ff87;
        }
        .nav-links {
          display: flex;
          gap: 24px;
        }
        .nav-link {
          color: rgba(255, 255, 255, 0.7);
          text-decoration: none;
          font-weight: 500;
          font-size: 0.95rem;
          transition: color 0.2s;
        }
        .nav-link:hover {
          color: #ffffff;
        }
        .connect-btn {
          background: linear-gradient(135deg, #00ff87 0%, #60efff 100%);
          border: none;
          color: #0a0a0a;
          padding: 10px 20px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }
        .connect-btn:hover {
          transform: translateY(-1px);
          opacity: 0.95;
        }
        .wallet-badge {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 500;
        }
      `}</style>
    </nav>
  );
}
