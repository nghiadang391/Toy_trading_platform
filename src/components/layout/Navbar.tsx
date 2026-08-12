"use client";

import Link from "next/link";
import { useState } from "react";
import { useLanguage } from "@/lib/LanguageContext";

export default function Navbar() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  async function connectWallet() {
    setConnecting(true);
    try {
      const { initConfig, connect } = await import("@joyid/ckb");
      initConfig({
        name: "ToyTrade",
        logo: "https://toytrade.vercel.app/logo.png",
        joyidAppURL: "https://testnet.joyid.dev",
      });

      const res = await connect();
      if (res && res.address) {
        setWalletAddress(res.address);
        await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            joyIdAddress: res.address,
            displayName: "Passkey Explorer " + res.address.substring(res.address.length - 4),
            region: language === "vi" ? "VIETNAM" : "UK",
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
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-md font-sans">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-extrabold text-white tracking-tight">
          Toy<span className="text-[#00ff87]">Trade</span>
        </Link>
        
        <div className="flex items-center gap-8">
          <div className="flex gap-6">
            <Link href="/listings" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
              {t("browseToys")}
            </Link>
            <Link href="/listings/create" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
              {t("sellAToy")}
            </Link>
            <Link href="/messages" className="text-sm font-semibold text-white/70 hover:text-white transition-colors">
              {t("messages")}
            </Link>
          </div>
          
          {/* Language Toggle Control */}
          <div className="flex items-center gap-2 border border-white/10 bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setLanguage("en")}
              className={`px-2 py-1 text-xs font-bold rounded transition-all ${
                language === "en" ? "bg-[#00ff87] text-black" : "text-white/60 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("vi")}
              className={`px-2 py-1 text-xs font-bold rounded transition-all ${
                language === "vi" ? "bg-[#00ff87] text-black" : "text-white/60 hover:text-white"
              }`}
            >
              VI
            </button>
          </div>

          <div>
            {walletAddress ? (
              <span className="inline-flex items-center rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white">
                🔑 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
            ) : (
              <button 
                className="rounded-lg bg-gradient-to-r from-[#00ff87] to-[#60efff] px-5 py-2 text-sm font-bold text-black hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                onClick={connectWallet} 
                disabled={connecting}
              >
                {connecting ? t("connecting") : t("fingerprintConnect")}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
